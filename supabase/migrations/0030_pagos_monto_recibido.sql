-- 0030_pagos_monto_recibido.sql
-- Épica P — integración de `pago_en_proceso` en Mis pedidos (P4.4, SPEI con
-- monto distinto). `registrar_pago_stripe()` (0029) ya RECIBE
-- `p_amount_received_cents` desde el webhook (`paymentIntent.amount_received`,
-- `webhook.ts`) pero nunca lo guardaba en ningún lado — solo lo usaba para
-- comparar contra `amount_cents` y decidir `needs_review`. Sin persistirlo,
-- no hay forma de mostrarle al cliente "recibimos $X y tu pedido es de $Y"
-- (diseño-pagos-stripe.md §4, fila "Pago parcial o de más").
--
-- Decisión de RLS (documentada aquí porque es la razón de ser de esta
-- migración, no solo la columna): `payments_select_own` (0028) YA deja al
-- cliente leer sus propios pagos completos por fila (RLS es row-level, no
-- hay column-level RLS nativo en Postgres). No se crea una función
-- `security definer` nueva ni una vista aparte porque esa policy ya está
-- acotada correctamente (dueño del pedido o admin) y el resto de columnas
-- del renglón (marca/últimos 4 de tarjeta, method, status) no son más
-- sensibles que lo que ya se le mostraba al cliente en
-- `obtenerPagoStripeDelPedido()` — la minimización real ocurre en la capa
-- de consulta de TypeScript (`select` explícito de columnas, nunca `select
-- *`), igual que ya hacía esa función antes de este incremento.
alter table public.payments add column amount_received_cents integer;

create or replace function public.registrar_pago_stripe(
  p_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_payment_intent_id text,
  p_status text,
  p_amount_received_cents integer default null,
  p_instructions jsonb default null,
  p_card_brand text default null,
  p_card_last4 text default null,
  p_needs_review boolean default false
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_order public.orders;
begin
  if p_status not in (
    'iniciado', 'requiere_accion', 'procesando', 'pagado', 'fallido',
    'vencido', 'cancelado', 'revision'
  ) then
    raise exception 'Estado de pago inválido: %', p_status using errcode = '22023';
  end if;

  -- Idempotencia (P5.2): un evento ya registrado no se vuelve a aplicar.
  insert into public.stripe_webhook_events (event_id, type, payload)
  values (p_event_id, p_event_type, p_payload)
  on conflict (event_id) do nothing;

  if not found then
    select * into v_payment from public.payments where stripe_payment_intent_id = p_payment_intent_id;
    return v_payment;
  end if;

  select * into v_payment from public.payments where stripe_payment_intent_id = p_payment_intent_id for update;

  if v_payment.id is null then
    -- Evento de un PaymentIntent que no reconocemos (no debería pasar si
    -- todo intento se crea vía iniciar_pago_stripe primero) — se deja
    -- constancia en stripe_webhook_events, sin nada más que actualizar.
    update public.stripe_webhook_events
    set processed_at = now(), result = 'sin_pago_asociado'
    where event_id = p_event_id;
    return null;
  end if;

  update public.payments
  set status = p_status,
      instructions = coalesce(p_instructions, instructions),
      card_brand = coalesce(p_card_brand, card_brand),
      card_last4 = coalesce(p_card_last4, card_last4),
      -- Nuevo (0030): se guarda SIEMPRE que el evento traiga un monto
      -- (incluye $0 en 'requires_action'/'processing' — coalesce respeta
      -- eso porque solo cae al valor previo cuando el parámetro es NULL,
      -- no cuando es 0), para que P4.4 pueda mostrar "recibimos $X" tanto
      -- en el caso final (pagado con monto distinto) como mientras Stripe
      -- todavía está acumulando fondos de SPEI.
      amount_received_cents = coalesce(p_amount_received_cents, amount_received_cents),
      needs_review = p_needs_review or needs_review
  where id = v_payment.id
  returning * into v_payment;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  if p_status = 'pagado' then
    if p_amount_received_cents is not null and p_amount_received_cents <> v_payment.amount_cents then
      -- P5.5 / arquitectura §4.3: el monto que Stripe confirmó no
      -- coincide con lo esperado (pago parcial o de más) — no se avanza
      -- el pedido solo, se marca para revisión del admin.
      update public.payments set needs_review = true where id = v_payment.id;
    elsif v_order.status = 'pago_en_proceso' then
      -- Camino normal: el inventario ya está apartado desde
      -- iniciar_pago_stripe(); solo cambia el estado del pedido (nunca
      -- reutiliza apartar_pedido() aquí porque volvería a apartar).
      update public.orders set status = 'comprobante_recibido' where id = v_order.id returning * into v_order;
      insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
      values (v_order.id, 'pago_en_proceso', 'comprobante_recibido', null, 'stripe');
      perform public.notificar_comprobante_recibido(v_order.id);
    elsif v_order.status = 'pendiente_pago' then
      -- arquitectura §4.1: el apartado ya se había liberado (venció)
      -- cuando llegó el pago. Se intenta apartar de nuevo — si ya no hay
      -- stock, apartar_pedido() lanza y esta transacción se revierte
      -- hasta aquí; se marca para revisión en vez de fallar el webhook
      -- completo (RN-16: el admin resuelve acreditando saldo a favor).
      begin
        v_order := public.apartar_pedido(v_order.id, null, 'stripe', 'comprobante_recibido');
      exception
        when others then
          update public.payments set needs_review = true where id = v_payment.id;
      end;
    else
      -- El pedido ya avanzó más allá (listo_envio, enviado...) o se
      -- canceló — no se toca su estado; caso raro (doble webhook fuera
      -- de orden, pago tardío sobre un pedido ya cancelado), se marca
      -- para revisión manual.
      update public.payments set needs_review = true where id = v_payment.id;
    end if;
  elsif p_status = 'cancelado' and v_order.status = 'pago_en_proceso' then
    perform public.liberar_apartado(v_order.id, 'pendiente_pago', 'Pago cancelado o vencido en Stripe', null, 'stripe');
  end if;

  update public.stripe_webhook_events set processed_at = now(), result = p_status where event_id = p_event_id;

  select * into v_payment from public.payments where id = v_payment.id;
  return v_payment;
end;
$$;

revoke execute on function public.registrar_pago_stripe from public, anon, authenticated;
grant execute on function public.registrar_pago_stripe to service_role;
