-- 0015_acciones_pedidos_admin.sql
-- Panel admin — Pedidos (C5): las dos transiciones que 0008 no cubría
-- porque en esa fase no existía todavía quien las disparara desde una
-- interfaz. Mismo patrón que el resto de `funciones_transaccionales.sql`
-- (bloqueo de fila, bitácora, notificación por outbox, service_role-only).
--
-- - validar_pago(): comprobante_recibido → listo_envio (C5.3). Cubre
--   IGUAL los pedidos normales (con comprobante) y los RN-11 (pagados
--   100% con saldo, sin comprobante) — ambos llegan a comprobante_recibido
--   por el mismo camino (apartar_pedido, ya sea vía confirmar_comprobante
--   o vía crear_pedido cuando el saldo cubre el total) y ambos requieren
--   la misma confirmación humana explícita (RN-11, decisión de la dueña
--   2026-09-20: "ningún pedido cambia de estado sin una acción humana
--   explícita").
-- - marcar_entregado(): enviado → entregado (C5.3), y FIJA `delivered_at`
--   — ninguna función anterior lo hacía. Sin esto, D1 (solicitar
--   devolución) nunca encontraría un pedido elegible: su función
--   `solicitar_devolucion()` (0012) exige `status = 'entregado'` y calcula
--   el plazo desde `delivered_at`.

create function public.validar_pago(
  p_order_id uuid,
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
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'El pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status <> 'comprobante_recibido' then
    raise exception 'El pedido % no está en comprobante_recibido (está en %)', v_order.folio, v_order.status
      using errcode = '22023';
  end if;

  update public.orders
  set status = 'listo_envio', paid_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
  values (p_order_id, 'comprobante_recibido', 'listo_envio', p_changed_by, p_source);

  insert into public.notification_outbox (event_type, channel, destino, payload)
  select 'pedido.pago_validado', 'correo', pr.email,
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio)
  from public.profiles pr
  where pr.id = v_order.user_id;

  return v_order;
end;
$$;

create function public.marcar_entregado(
  p_order_id uuid,
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
begin
  select * into v_order from public.orders where id = p_order_id for update;

  if v_order.id is null then
    raise exception 'El pedido % no existe', p_order_id using errcode = 'P0002';
  end if;

  if v_order.status <> 'enviado' then
    raise exception 'El pedido % no está en enviado (está en %)', v_order.folio, v_order.status
      using errcode = '22023';
  end if;

  update public.orders
  set status = 'entregado', delivered_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
  values (p_order_id, 'enviado', 'entregado', p_changed_by, p_source);

  insert into public.notification_outbox (event_type, channel, destino, payload)
  select 'pedido.entregado', 'correo', pr.email,
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio)
  from public.profiles pr
  where pr.id = v_order.user_id;

  return v_order;
end;
$$;

revoke execute on function public.validar_pago from public, anon, authenticated;
revoke execute on function public.marcar_entregado from public, anon, authenticated;
grant execute on function public.validar_pago to service_role;
grant execute on function public.marcar_entregado to service_role;
