-- 0008_funciones_transaccionales.sql
-- Funciones de Postgres que garantizan cero sobreventas y saldo nunca
-- negativo bajo concurrencia (arquitectura.md §9.1). Toda transición que
-- mueve inventario o saldo ocurre AQUÍ, en una sola transacción, nunca en
-- varios pasos sueltos desde TypeScript.
--
-- Llamadas por RPC exclusivamente desde `src/server/db/mutations/` con el
-- cliente `service_role` (arquitectura §6.1): por eso se revoca EXECUTE a
-- `anon`/`authenticated` — nadie desde el navegador puede invocarlas
-- directo, ni siquiera un usuario autenticado legítimo. `_guard.ts` ya
-- validó autenticación/autorización antes de llegar aquí.

-- ────────────────────────────────────────────────────────────────────────
-- apartar_pedido: se llama al confirmar/subir el comprobante de pago.
-- Mueve pendiente_pago → comprobante_recibido y aparta las piezas.
-- ────────────────────────────────────────────────────────────────────────
create function public.apartar_pedido(
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

  -- 4. Encolar notificación (patrón outbox, §7.3): si la transacción se
  --    revierte, la notificación desaparece con ella.
  select value into v_admin_email from public.settings where key = 'admin_email';
  select value into v_admin_whatsapp from public.settings where key = 'admin_whatsapp';

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

  return v_order;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- liberar_apartado: rechazo de comprobante (→ pendiente_pago) o
-- cancelación (→ cancelado). Libera las piezas apartadas, si las había.
-- ────────────────────────────────────────────────────────────────────────
create function public.liberar_apartado(
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
  set status = p_target_status
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

-- ────────────────────────────────────────────────────────────────────────
-- marcar_enviado: el asesor confirma el envío y el costo de envío en el
-- mismo acto. Baja el stock físico y libera el apartado a la vez.
-- ────────────────────────────────────────────────────────────────────────
create function public.marcar_enviado(
  p_order_id uuid,
  p_shipping_cost numeric,
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

  if v_order.status <> 'listo_envio' then
    raise exception 'El pedido % no está en listo_envio (está en %)', v_order.folio, v_order.status
      using errcode = '22023';
  end if;

  perform 1
  from public.products p
  where p.id in (select oi.product_id from public.order_items oi where oi.order_id = p_order_id)
  order by p.id
  for update;

  update public.products p
  set stock = p.stock - oi.qty,
      reserved = p.reserved - oi.qty,
      sales_count = p.sales_count + oi.qty
  from public.order_items oi
  where oi.order_id = p_order_id
    and p.id = oi.product_id;

  update public.orders
  set status = 'enviado',
      shipped_at = now(),
      shipping_cost = p_shipping_cost
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
  values (p_order_id, 'listo_envio', 'enviado', p_changed_by, p_source);

  insert into public.notification_outbox (event_type, channel, destino, payload)
  select 'pedido.enviado', 'correo', pr.email,
    jsonb_build_object('order_id', v_order.id, 'folio', v_order.folio)
  from public.profiles pr
  where pr.id = v_order.user_id;

  return v_order;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- aplicar_saldo: registra un movimiento de saldo a favor (positivo abona,
-- negativo aplica) y garantiza que nunca quede negativo (RN-7). Como el
-- saldo es un libro de movimientos (D2), no un contador, se serializa por
-- cliente con un advisory lock transaccional en vez de bloquear una fila
-- que no existe.
-- ────────────────────────────────────────────────────────────────────────
create function public.aplicar_saldo(
  p_user_id uuid,
  p_amount numeric,
  p_kind text,
  p_description text,
  p_order_id uuid default null,
  p_return_id uuid default null,
  p_created_by uuid default null
)
returns public.credit_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12, 2);
  v_movement public.credit_movements;
begin
  if p_kind not in ('devolucion', 'aplicado', 'ajuste') then
    raise exception 'Tipo de movimiento de saldo inválido: %', p_kind;
  end if;

  -- Serializa las operaciones de saldo del mismo cliente: dos aplicaciones
  -- simultáneas no pueden leer el mismo saldo "antes" y ambas aprobarse.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  select coalesce(sum(amount), 0) into v_balance
  from public.credit_movements
  where user_id = p_user_id;

  if v_balance + p_amount < 0 then
    raise exception 'Saldo insuficiente: disponible %, se intentó aplicar %', v_balance, p_amount
      using errcode = '23514';
  end if;

  insert into public.credit_movements (user_id, amount, kind, order_id, return_id, description, created_by)
  values (p_user_id, p_amount, p_kind, p_order_id, p_return_id, p_description, p_created_by)
  returning * into v_movement;

  return v_movement;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- generar_folio: folio corto, único y no adivinable en secuencia obvia
-- (§9.2). Alfabeto base32 sin 0/O/1/I/L. No garantiza unicidad por sí
-- mismo: quien crea el pedido/devolución/solicitud reintenta ante una
-- colisión de UNIQUE (probabilidad despreciable, ~1 mil millones de
-- combinaciones con 6 caracteres).
-- ────────────────────────────────────────────────────────────────────────
create function public.generar_folio(p_prefix text default 'SGQ', p_length int default 6)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..p_length loop
    result := result || substr(alphabet, 1 + (get_byte(gen_random_bytes(1), 0) % length(alphabet)), 1);
  end loop;
  return p_prefix || '-' || result;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- Permisos: solo el servidor (service_role) invoca estas funciones por
-- RPC. Ni `anon` ni `authenticated` pueden llamarlas directo.
-- ────────────────────────────────────────────────────────────────────────
revoke execute on function public.apartar_pedido from public, anon, authenticated;
revoke execute on function public.liberar_apartado from public, anon, authenticated;
revoke execute on function public.marcar_enviado from public, anon, authenticated;
revoke execute on function public.aplicar_saldo from public, anon, authenticated;
revoke execute on function public.generar_folio from public, anon, authenticated;

grant execute on function public.apartar_pedido to service_role;
grant execute on function public.liberar_apartado to service_role;
grant execute on function public.marcar_enviado to service_role;
grant execute on function public.aplicar_saldo to service_role;
grant execute on function public.generar_folio to service_role;
