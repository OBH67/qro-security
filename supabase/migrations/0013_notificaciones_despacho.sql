-- 0013_notificaciones_despacho.sql
-- Séptimo incremento: construye el despachador real de notificaciones
-- (`src/server/notifications/`, arquitectura.md §7.3). Dos cambios de
-- esquema, ninguno toca migraciones ya aplicadas (se usa `create or
-- replace function`, mismo criterio que 0011 con `crear_pedido()`):
--
-- 1. `notification_outbox.next_attempt_at`: el cron de reintentos
--    (`/api/cron/reintentar-notificaciones`) necesita saber CUÁNDO
--    reintentar una fila fallida con espera creciente (2^intentos
--    minutos) sin tener que inferirlo de `created_at`, que no refleja el
--    último intento real.
-- 2. `apartar_pedido()` se reemplaza (mismo cuerpo, un solo agregado) para
--    encolar también el correo al CLIENTE cuando sube su comprobante
--    (C2.4: "el cliente ve el aviso... y el mensaje de que un agente lo
--    contactará en máximo 24 horas") — hasta ahora solo se avisaba al
--    administrador.

alter table public.notification_outbox
  add column next_attempt_at timestamptz not null default now();

create index notification_outbox_next_attempt_idx
  on public.notification_outbox (next_attempt_at)
  where status in ('pendiente', 'fallido');

create or replace function public.apartar_pedido(
  p_order_id uuid,
  p_changed_by uuid default null,
  p_source text default 'sistema'
)
returns public.orders
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
  set status = 'comprobante_recibido'
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
  values (p_order_id, 'pendiente_pago', 'comprobante_recibido', p_changed_by, p_source);

  -- 4. Encolar notificaciones (patrón outbox, §7.3): si la transacción se
  --    revierte, la notificación desaparece con ella.
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
  -- Nuevo en este incremento (ver cabecera): aviso al propio cliente.
  insert into public.notification_outbox (event_type, channel, destino, payload)
  values (
    'comprobante.recibido.cliente',
    'correo',
    coalesce(v_cliente_email, ''),
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio, 'total', v_order.total)
  );

  return v_order;
end;
$$;

revoke execute on function public.apartar_pedido from public, anon, authenticated;
grant execute on function public.apartar_pedido to service_role;
