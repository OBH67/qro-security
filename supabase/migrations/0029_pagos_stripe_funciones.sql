-- 0029_pagos_stripe_funciones.sql
-- Épica P — Pagos con Stripe. Segunda migración: funciones PL/pgSQL que
-- usan 'pago_en_proceso' (ya committeado por 0028) y las nuevas
-- funciones transaccionales del flujo Stripe. Mismo candado/criterio de
-- concurrencia que 0008/0010/0011 (`for update`, bloqueo de productos
-- SIEMPRE ordenado por id, security definer, revoke a anon/authenticated).

-- ────────────────────────────────────────────────────────────────────────
-- 0. notificar_comprobante_recibido: se EXTRAE del cuerpo de
--    apartar_pedido() (0008/0013) para reutilizarla también desde
--    registrar_pago_stripe() — requerimientos-pagos-stripe.md P5.3: "Pago
--    exitoso (cualquier método) → bandeja de revisión + la MISMA
--    notificación al admin que un comprobante". Mismo contenido/mismo
--    payload que ya insertaba apartar_pedido(), solo movido a una función
--    propia en vez de duplicado en dos lugares.
-- ────────────────────────────────────────────────────────────────────────
create function public.notificar_comprobante_recibido(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_admin_email text;
  v_admin_whatsapp text;
  v_cliente_email text;
begin
  select * into v_order from public.orders where id = p_order_id;
  select value into v_admin_email from public.settings where key = 'admin_email';
  select value into v_admin_whatsapp from public.settings where key = 'admin_whatsapp';
  select email into v_cliente_email from public.profiles where id = v_order.user_id;

  insert into public.notification_outbox (event_type, channel, destino, payload)
  values (
    'comprobante.recibido',
    'correo',
    coalesce(v_admin_email, ''),
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'total', v_order.total)
  );
  insert into public.notification_outbox (event_type, channel, destino, payload)
  values (
    'comprobante.recibido',
    'whatsapp',
    coalesce(v_admin_whatsapp, ''),
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'total', v_order.total)
  );
  insert into public.notification_outbox (event_type, channel, destino, payload)
  values (
    'comprobante.recibido.cliente',
    'correo',
    coalesce(v_cliente_email, ''),
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'total', v_order.total)
  );
end;
$$;

revoke execute on function public.notificar_comprobante_recibido from public, anon, authenticated;
grant execute on function public.notificar_comprobante_recibido to service_role;

-- ────────────────────────────────────────────────────────────────────────
-- 1. apartar_pedido(): agrega el parámetro `p_target_status`, con default
--    'comprobante_recibido' para no romper a `crear_pedido()` ni a
--    `confirmar_comprobante()` (llaman con 3 argumentos posicionales).
--    Agregar un parámetro cambia la firma para Postgres — `create or
--    replace` no la sustituye, crearía un overload (mismo criterio que
--    0011 con `crear_pedido()`): se elimina la firma vieja primero.
--
--    RN-13/RN-15: `iniciar_pago_stripe()` (más abajo) llama a esta misma
--    función pidiendo 'pago_en_proceso' en vez de 'comprobante_recibido'
--    — mismo candado de concurrencia, mismo camino de apartado, sin
--    lógica paralela. Mientras el pago está "en proceso" el pedido NO
--    entra todavía a la bandeja de revisión ni se notifica al admin: eso
--    pasa hasta que el webhook confirme el pago
--    (registrar_pago_stripe()).
-- ────────────────────────────────────────────────────────────────────────
drop function if exists public.apartar_pedido(uuid, uuid, text);

create function public.apartar_pedido(
  p_order_id uuid,
  p_changed_by uuid default null,
  p_source text default 'sistema',
  p_target_status public.order_status default 'comprobante_recibido'
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if p_target_status not in ('comprobante_recibido', 'pago_en_proceso') then
    raise exception 'apartar_pedido solo admite comprobante_recibido o pago_en_proceso, recibido: %', p_target_status
      using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'El pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status <> 'pendiente_pago' then
    raise exception 'El pedido % no está en pendiente_pago (está en %)', v_order.folio, v_order.status
      using errcode = '22023';
  end if;

  -- 1. Bloquear las filas de producto involucradas, SIEMPRE ordenadas por
  --    id, para evitar interbloqueos cuando dos pedidos comparten varios
  --    productos en distinto orden.
  perform 1
  from public.products p
  where p.id in (select oi.product_id from public.order_items oi where oi.order_id = p_order_id)
  order by p.id
  for update;

  -- 2. Apartar: el CHECK products_reserved_valid (reserved <= stock) aborta
  --    toda la transacción si no alcanza. Es la garantía real, no una
  --    esperanza del código.
  begin
    update public.products p
    set reserved = p.reserved + oi.qty
    from public.order_items oi
    where oi.order_id = p_order_id
      and p.id = oi.product_id;
  exception
    when check_violation then
      raise exception 'Ya no hay piezas suficientes para completar el pedido %: otro cliente apartó la última disponible.', v_order.folio
        using errcode = '23514';
  end;

  -- 3. Cambiar el estado del pedido + bitácora.
  update public.orders
  set status = p_target_status
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
  values (p_order_id, 'pendiente_pago', p_target_status, p_changed_by, p_source);

  -- 4. Notificar solo si el pedido entra de una vez a la bandeja de
  --    revisión humana (comprobante, o saldo que cubre el 100%). Un
  --    apartado hacia pago_en_proceso avisa hasta que Stripe confirme.
  if p_target_status = 'comprobante_recibido' then
    perform public.notificar_comprobante_recibido(v_order.id);
  end if;

  return v_order;
end;
$$;

revoke execute on function public.apartar_pedido from public, anon, authenticated;
grant execute on function public.apartar_pedido to service_role;

-- ────────────────────────────────────────────────────────────────────────
-- 2. liberar_apartado(): acepta pago_en_proceso como origen (mismo
--    criterio de apartado/liberación que comprobante_recibido/
--    listo_envio) y corrige el bug documentado en 0027: `from_status` se
--    guardaba leyendo `v_order.status` DESPUÉS del `update ... returning`
--    de más abajo — es decir, con el estado YA nuevo, así que
--    `order_status_history` quedaba siempre con from_status = to_status.
--    Se captura el estado anterior ANTES de tocar el pedido. Misma firma
--    que antes (no agrega parámetros): `create or replace` sí sustituye
--    correctamente (mismo criterio que 0023/0027).
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.liberar_apartado(
  p_order_id uuid,
  p_target_status public.order_status,
  p_reason text default null,
  p_changed_by uuid default null,
  p_source text default 'panel'
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_status_previo public.order_status;
begin
  if p_target_status not in ('pendiente_pago', 'cancelado') then
    raise exception 'liberar_apartado solo admite pendiente_pago o cancelado, recibido: %', p_target_status;
  end if;

  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'El pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status = 'enviado' or v_order.status = 'entregado' then
    raise exception 'El pedido % ya se envió; no se puede cancelar ni regresar a pendiente_pago', v_order.folio
      using errcode = '22023';
  end if;

  -- Bug corregido (ver cabecera): capturar ANTES del update de abajo.
  v_status_previo := v_order.status;

  -- Solo hay algo que liberar si el pedido llegó a apartar piezas
  -- (comprobante_recibido, listo_envio, o ahora pago_en_proceso — un
  -- intento de Stripe también apartó inventario al iniciar, RN-13). Si
  -- sigue en pendiente_pago, reserved ya es 0 para sus productos y no hay
  -- nada que restar.
  if v_status_previo in ('comprobante_recibido', 'listo_envio', 'pago_en_proceso') then
    perform 1
    from public.products p
    where p.id in (select oi.product_id from public.order_items oi where oi.order_id = p_order_id)
    order by p.id
    for update;

    update public.products p
    set reserved = greatest(p.reserved - oi.qty, 0)
    from public.order_items oi
    where oi.order_id = p_order_id
      and p.id = oi.product_id;
  end if;

  update public.orders
  set status = p_target_status,
      cancellation_reason = case when p_target_status = 'cancelado' then p_reason else cancellation_reason end
  where id = p_order_id
  returning * into v_order;

  -- Rechazo de comprobante (vuelve a pendiente_pago): el comprobante que
  -- seguía en revisión queda marcado como rechazado. Un pedido de Stripe
  -- nunca tiene payment_proofs, así que este UPDATE simplemente no
  -- encuentra filas y no hace nada.
  if p_target_status = 'pendiente_pago' then
    update public.payment_proofs
    set status = 'rechazado', reviewed_by = p_changed_by, reviewed_at = now(), rejection_reason = p_reason
    where order_id = p_order_id and status = 'pendiente';
  end if;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source, note)
  values (p_order_id, v_status_previo, p_target_status, p_changed_by, p_source, p_reason);

  if p_target_status = 'cancelado' then
    insert into public.notification_outbox (event_type, channel, destino, payload)
    select 'pedido.cancelado', 'correo', pr.email,
      jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'motivo', p_reason)
    from public.profiles pr
    where pr.id = v_order.user_id;
  elsif p_source <> 'stripe' then
    -- La plantilla de 'pedido.pago_rechazado' asume "rechazamos el
    -- comprobante que subiste" (texto fijo del correo) — no le queda a
    -- una liberación AUTOMÁTICA de Stripe (tarjeta vencida a los 30 min,
    -- voucher OXXO vencido, SPEI cancelado). En vez de mandar un correo
    -- con texto incorrecto, se omite aquí — el cliente igual ve el
    -- estado real en "Mis pedidos" — y queda pendiente como incremento
    -- aparte (fuera de alcance de un cambio solo-backend): una plantilla
    -- propia para "tu intento de pago no se completó, puedes reintentar".
    insert into public.notification_outbox (event_type, channel, destino, payload)
    select 'pedido.pago_rechazado', 'correo', pr.email,
      jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'motivo', p_reason)
    from public.profiles pr
    where pr.id = v_order.user_id;
  end if;

  return v_order;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- 3. iniciar_pago_stripe(): aparta (vía apartar_pedido, hacia
--    pago_en_proceso) + crea la fila en payments. RN-13: si ya no hay
--    disponible, apartar_pedido() rechaza antes de que exista cualquier
--    fila de payments (nunca se genera un PaymentIntent para un pedido
--    que no se pudo apartar). Idempotente por (order_id, idempotency_key)
--    — P2.3: un reintento con la misma llave regresa el mismo intento en
--    vez de apartar dos veces.
-- ────────────────────────────────────────────────────────────────────────
create function public.iniciar_pago_stripe(
  p_order_id uuid,
  p_method text,
  p_amount_cents integer,
  p_expires_at timestamptz,
  p_idempotency_key uuid,
  p_changed_by uuid default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_payment public.payments;
begin
  if p_method not in ('tarjeta', 'oxxo', 'spei') then
    raise exception 'Método de pago inválido para Stripe: %', p_method using errcode = '22023';
  end if;
  if p_amount_cents <= 0 then
    raise exception 'Monto inválido para iniciar el pago' using errcode = '22023';
  end if;

  select * into v_payment
  from public.payments
  where order_id = p_order_id and idempotency_key = p_idempotency_key;

  if v_payment.id is not null then
    return v_payment;
  end if;

  -- Mismo candado/estado que el flujo de comprobante (§9.1), apartando
  -- hacia pago_en_proceso en vez de comprobante_recibido.
  v_order := public.apartar_pedido(p_order_id, p_changed_by, 'cliente', 'pago_en_proceso');

  -- El método real se elige en el paso de pago (P1), no al crear el
  -- pedido (crear_pedido() asume 'transferencia' por defecto) — se
  -- corrige aquí.
  update public.orders set payment_method = p_method where id = p_order_id;

  insert into public.payments (order_id, method, amount_cents, expires_at, idempotency_key)
  values (p_order_id, p_method, p_amount_cents, p_expires_at, p_idempotency_key)
  returning * into v_payment;

  return v_payment;
end;
$$;

revoke execute on function public.iniciar_pago_stripe from public, anon, authenticated;
grant execute on function public.iniciar_pago_stripe to service_role;

-- ────────────────────────────────────────────────────────────────────────
-- 4. registrar_pago_stripe(): traduce un evento de webhook ya verificado
--    (arquitectura §5) a un cambio de estado. P5.2: idempotente vía
--    `stripe_webhook_events` (event_id PK) — un evento ya procesado no
--    vuelve a tocar nada. P5.5: valida el monto confirmado contra
--    `payments.amount_cents`; un desajuste (SPEI con monto distinto, §4.3)
--    NUNCA avanza el pedido solo, se marca para revisión humana.
--
--    RN-11 (definitiva, confirmada por la dueña — nunca cambia sin que
--    ella lo pida explícitamente): un pago confirmado por Stripe entra a
--    LA MISMA bandeja de revisión manual que hoy usa comprobante
--    (comprobante_recibido). JAMÁS pasa directo a listo_envio — eso solo
--    lo hace `validar_pago()` (0015/0027), a mano, desde el panel.
-- ────────────────────────────────────────────────────────────────────────
create function public.registrar_pago_stripe(
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
