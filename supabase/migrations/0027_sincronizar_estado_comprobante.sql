-- 0027_sincronizar_estado_comprobante.sql
-- Bug reportado por la dueña: un pedido ya "Enviado" (comprobante
-- aprobado hace tiempo, pedido avanzó todo el camino) seguía mostrando
-- "Comprobante · En revisión" en Mi cuenta. Causa: `validar_pago()`
-- (0015) y `liberar_apartado()` (0008, usada también para rechazar un
-- comprobante) siempre actualizaron `orders.status`, pero NUNCA
-- `payment_proofs.status`/`reviewed_by`/`reviewed_at`/`rejection_reason`
-- — columnas que existen desde el día 1 (0004_pedidos.sql) pero que
-- ninguna función llegó a escribir. `obtenerPedidoPorFolio()` (lado
-- cliente) lee el comprobante directo de esa tabla, así que se quedaba
-- pegado en "pendiente" (→ "En revisión" en pantalla) para siempre, sin
-- importar qué tan lejos avanzara el pedido.
--
-- Ambas funciones se reemplazan con `create or replace` (mismos
-- parámetros que antes, no cambia la firma — a diferencia de 0025/0026,
-- aquí no hace falta eliminar y recrear).
create or replace function public.validar_pago(
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

  -- RN-11: un pedido pagado 100% con saldo llega aquí sin ningún
  -- comprobante — este UPDATE simplemente no encuentra filas y no hace
  -- nada, no es un error.
  update public.payment_proofs
  set status = 'validado', reviewed_by = p_changed_by, reviewed_at = now()
  where order_id = p_order_id and status = 'pendiente';

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
  set status = p_target_status
  where id = p_order_id
  returning * into v_order;

  -- Rechazo de comprobante (vuelve a pendiente_pago): el comprobante que
  -- seguía en revisión queda marcado como rechazado, con el motivo
  -- visible en Mi cuenta. Una cancelación (p_target_status = 'cancelado')
  -- NUNCA toca el comprobante — cancelar no es lo mismo que rechazar un
  -- pago que puede seguir siendo válido.
  if p_target_status = 'pendiente_pago' then
    update public.payment_proofs
    set status = 'rechazado', reviewed_by = p_changed_by, reviewed_at = now(), rejection_reason = p_reason
    where order_id = p_order_id and status = 'pendiente';
  end if;

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
