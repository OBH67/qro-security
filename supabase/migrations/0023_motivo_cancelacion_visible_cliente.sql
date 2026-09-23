-- 0023_motivo_cancelacion_visible_cliente.sql
-- El motivo de cancelación que captura el admin se guardaba solo en
-- order_status_history.note — tabla que el cliente no puede leer por RLS
-- (solo admin, ver 0007 y el comentario en obtenerPedidoPorFolio). El
-- cliente nunca lo veía en el sitio, aunque sí llega en el correo de
-- "pedido cancelado" (construirPedidoCancelado). Se copia a una columna
-- propia de orders, que el cliente ya puede leer (RLS le deja ver sus
-- propios pedidos completos).

alter table public.orders add column cancellation_reason text;

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

  -- Solo hay algo que liberar si el pedido llegó a apartar piezas
  -- (comprobante_recibido o listo_envio). Si sigue en pendiente_pago,
  -- reserved ya es 0 para sus productos y no hay nada que restar.
  if v_order.status in ('comprobante_recibido', 'listo_envio') then
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

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source, note)
  values (p_order_id, v_order.status, p_target_status, p_changed_by, p_source, p_reason);

  insert into public.notification_outbox (event_type, channel, destino, payload)
  select
    case when p_target_status = 'cancelado' then 'pedido.cancelado' else 'pedido.pago_rechazado' end,
    'correo',
    pr.email,
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'motivo', p_reason)
  from public.profiles pr
  where pr.id = v_order.user_id;

  return v_order;
end;
$$;
