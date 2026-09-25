-- 0032_pago_tarjeta_sin_pedido_previo.sql
-- Épica P, corrección (2026-09-25). Decisión de la dueña: con TARJETA el
-- pedido solo existe si Stripe aceptó el pago. Antes (0029) el checkout
-- llamaba primero a crear_pedido() — que crea el pedido como
-- 'transferencia' y VACÍA el carrito — y después iniciaba el pago; si ese
-- segundo paso fallaba quedaba un pedido huérfano pidiendo comprobante.
--
-- Nuevo flujo de tarjeta:
--   1. preparar_pago_tarjeta(): valida existencias y guarda una fila en
--      `payments` SIN pedido (order_id null) con la foto del checkout.
--   2. El servidor crea el PaymentIntent y el navegador lo confirma.
--   3. crear_pedido_desde_pago(): solo con el pago ya aceptado, crea el
--      pedido (reutiliza crear_pedido(), que vacía el carrito), lo marca
--      'tarjeta' y lo manda a la cola de revisión (RN-11: nunca a
--      listo_envio). Idempotente: la llaman el navegador y el webhook, el
--      primero que llegue crea el pedido y el segundo recibe el mismo.
-- OXXO/SPEI siguen con el flujo de 0029 (pedido desde la ficha).

-- ── 1. Esquema ──────────────────────────────────────────────────────────
alter table public.payments alter column order_id drop not null;
alter table public.payments add column user_id uuid references public.profiles (id);
alter table public.payments add column checkout jsonb;
alter table public.payments add column ultimo_error text;

-- Un intento de tarjeta sin pedido se identifica por (cliente, llave).
create unique index payments_user_idempotency_idx
  on public.payments (user_id, idempotency_key)
  where user_id is not null;

-- ── 2. preparar_pago_tarjeta ────────────────────────────────────────────
create function public.preparar_pago_tarjeta(
  p_user_id uuid,
  p_checkout jsonb, -- { items:[{product_id,qty}], shipping_address, billing_data, wants_invoice, credit_to_apply, notes }
  p_amount_cents integer,
  p_idempotency_key uuid
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_producto record;
begin
  select * into v_payment from public.payments
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if v_payment.id is not null then
    return v_payment;
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'El monto a cobrar con tarjeta debe ser mayor a cero.' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(p_checkout -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'Tu pedido está vacío. Agrega productos antes de continuar.' using errcode = '22023';
  end if;

  -- Misma validación de crear_pedido() (0011), sin apartar: la dueña
  -- eligió no apartar inventario mientras se cobra la tarjeta. Revisar
  -- aquí deja la ventana de riesgo en segundos.
  for v_producto in
    select p.name, p.status, (p.stock - p.reserved) as disponible, (elem ->> 'qty')::int as qty
    from jsonb_array_elements(p_checkout -> 'items') elem
    left join public.products p on p.id = (elem ->> 'product_id')::uuid
  loop
    if v_producto.name is null then
      raise exception 'Uno o más productos de tu pedido ya no existen. Actualiza tu carrito e intenta de nuevo.' using errcode = '22023';
    end if;
    if v_producto.status <> 'activo' then
      raise exception 'El producto % ya no está disponible', v_producto.name using errcode = '22023';
    end if;
    if v_producto.qty > v_producto.disponible then
      raise exception 'Solo quedan % piezas disponibles de %, tu pedido pide %. Ajusta la cantidad.',
        v_producto.disponible, v_producto.name, v_producto.qty using errcode = '23514';
    end if;
  end loop;

  insert into public.payments (order_id, user_id, method, amount_cents, idempotency_key, checkout, status)
  values (null, p_user_id, 'tarjeta', p_amount_cents, p_idempotency_key, p_checkout, 'iniciado')
  returning * into v_payment;

  return v_payment;
end;
$$;

revoke execute on function public.preparar_pago_tarjeta from public, anon, authenticated;
grant execute on function public.preparar_pago_tarjeta to service_role;

-- ── 3. crear_pedido_desde_pago ──────────────────────────────────────────
-- Regresa el pedido creado (o el ya existente). Si no se puede crear
-- (sin existencias en el último segundo, saldo ya gastado...), NO lanza:
-- el cobro ya ocurrió, así que marca el pago para revisión, guarda el
-- motivo en `ultimo_error` y regresa null. El admin lo resuelve con saldo
-- a favor (RN-16).
create function public.crear_pedido_desde_pago(
  p_payment_id uuid,
  p_card_brand text default null,
  p_card_last4 text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_order public.orders;
  c jsonb;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then
    raise exception 'El pago % no existe', p_payment_id using errcode = 'P0002';
  end if;

  if v_payment.order_id is not null then
    select * into v_order from public.orders where id = v_payment.order_id;
    return v_order;
  end if;

  if v_payment.method <> 'tarjeta' or v_payment.checkout is null then
    raise exception 'El pago % no es un pago con tarjeta preparado en el checkout', p_payment_id using errcode = '22023';
  end if;

  c := v_payment.checkout;

  begin
    v_order := public.crear_pedido(
      v_payment.user_id,
      c -> 'items',
      c -> 'shipping_address',
      nullif(c -> 'billing_data', 'null'::jsonb),
      coalesce((c ->> 'wants_invoice')::boolean, false),
      coalesce((c ->> 'credit_to_apply')::numeric, 0),
      c ->> 'notes',
      v_payment.idempotency_key
    );

    update public.orders set payment_method = 'tarjeta' where id = v_order.id returning * into v_order;

    -- RN-11: a la MISMA cola de revisión manual que comprobante.
    v_order := public.apartar_pedido(v_order.id, v_payment.user_id, 'stripe', 'comprobante_recibido');

    update public.payments
    set order_id = v_order.id,
        status = 'pagado',
        card_brand = coalesce(p_card_brand, card_brand),
        card_last4 = coalesce(p_card_last4, card_last4),
        -- El saldo pudo cambiar entre preparar y cobrar: si el total del
        -- pedido no coincide con lo cobrado, que lo revise el admin.
        needs_review = needs_review or round(v_order.total * 100)::integer <> v_payment.amount_cents,
        ultimo_error = null
    where id = v_payment.id;

    return v_order;
  exception
    when others then
      update public.payments
      set status = 'revision', needs_review = true, ultimo_error = sqlerrm
      where id = v_payment.id;
      return null;
  end;
end;
$$;

revoke execute on function public.crear_pedido_desde_pago from public, anon, authenticated;
grant execute on function public.crear_pedido_desde_pago to service_role;

-- ── 4. registrar_pago_stripe: casos nuevos ──────────────────────────────
-- (a) Pago de tarjeta todavía sin pedido: solo se registra el evento; el
--     pedido lo crea crear_pedido_desde_pago() (llamado desde TypeScript).
-- (b) Pedido ya en revisión o más adelante con el monto correcto: ya lo
--     procesó el navegador; antes caía al "else" y lo marcaba a revisión.
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

  insert into public.stripe_webhook_events (event_id, type, payload)
  values (p_event_id, p_event_type, p_payload)
  on conflict (event_id) do nothing;

  if not found then
    select * into v_payment from public.payments where stripe_payment_intent_id = p_payment_intent_id;
    return v_payment;
  end if;

  select * into v_payment from public.payments where stripe_payment_intent_id = p_payment_intent_id for update;

  if v_payment.id is null then
    update public.stripe_webhook_events
    set processed_at = now(), result = 'sin_pago_asociado'
    where event_id = p_event_id;
    return null;
  end if;

  update public.payments
  set status = case when v_payment.status = 'revision' then 'revision' else p_status end,
      instructions = coalesce(p_instructions, instructions),
      card_brand = coalesce(p_card_brand, card_brand),
      card_last4 = coalesce(p_card_last4, card_last4),
      amount_received_cents = coalesce(p_amount_received_cents, amount_received_cents),
      needs_review = p_needs_review or needs_review
  where id = v_payment.id
  returning * into v_payment;

  -- (a)
  if v_payment.order_id is null then
    update public.stripe_webhook_events set processed_at = now(), result = p_status where event_id = p_event_id;
    return v_payment;
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;

  if p_status = 'pagado' then
    if p_amount_received_cents is not null and p_amount_received_cents <> v_payment.amount_cents then
      update public.payments set needs_review = true where id = v_payment.id;
    elsif v_order.status = 'pago_en_proceso' then
      update public.orders set status = 'comprobante_recibido' where id = v_order.id returning * into v_order;
      insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
      values (v_order.id, 'pago_en_proceso', 'comprobante_recibido', null, 'stripe');
      perform public.notificar_comprobante_recibido(v_order.id);
    elsif v_order.status = 'pendiente_pago' then
      begin
        v_order := public.apartar_pedido(v_order.id, null, 'stripe', 'comprobante_recibido');
      exception
        when others then
          update public.payments set needs_review = true where id = v_payment.id;
      end;
    elsif v_order.status in ('comprobante_recibido', 'listo_envio', 'enviado', 'entregado') then
      null; -- (b)
    else
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
