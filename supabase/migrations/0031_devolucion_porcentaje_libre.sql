-- 0031_devolucion_porcentaje_libre.sql
-- P9 (RN-6 modificada, diseño-pagos-stripe.md §8): el admin ya no elige
-- entre 100% / 70% / "otro" sin piso — elige un porcentaje ENTERO libre
-- entre 10 y 100, siempre a saldo a favor. Se valida aquí (no solo en el
-- cliente) porque el cliente nunca es la única línea de defensa.
--
-- Cambios de esquema:
-- 1. `return_items.percentage_suggested`: el porcentaje SUGERIDO por la
--    condición declarada (100 sellado / 70 abierto / 0 otro, RN-6
--    original), fijado al solicitar la devolución y ya INMUTABLE después.
--    Hace falta como columna aparte porque `percentage` se sobreescribe
--    con el valor final que el admin aprueba (comportamiento ya
--    existente desde 0018) — sin esto se pierde la base de comparación
--    para saber si el admin se apartó del sugerido. Se rellena hacia
--    atrás con el valor actual de `percentage` para las filas existentes
--    (mejor aproximación posible: una devolución ya resuelta no puede
--    recuperar el sugerido original si el admin ya lo cambió).
-- 2. `returns.percentage_overridden`: true si, al aprobar, el porcentaje
--    final de alguna partida quedó distinto de su sugerido. Junto con
--    `reviewed_by`/`reviewed_at` (ya existentes desde 0005) deja
--    registro de que el admin lo eligió a propósito (P9: "se registrará
--    que tú lo elegiste").
--
-- No se agrega ni se quita ningún parámetro a `resolver_devolucion` ni a
-- `solicitar_devolucion` — solo cambia el cuerpo, así que basta con
-- CREATE OR REPLACE (Postgres solo exige DROP + CREATE cuando cambia la
-- firma/identidad de la función, ya documentado en incrementos previos
-- de este proyecto).

alter table public.return_items
  add column percentage_suggested numeric(5, 2);

update public.return_items set percentage_suggested = percentage where percentage_suggested is null;

alter table public.return_items
  alter column percentage_suggested set not null,
  add constraint return_items_percentage_suggested_check check (percentage_suggested >= 0 and percentage_suggested <= 100);

alter table public.returns
  add column percentage_overridden boolean not null default false;

-- solicitar_devolucion: sin cambios de comportamiento salvo grabar el
-- sugerido también en su propia columna (mismo valor que antes se
-- guardaba solo en `percentage`).
create or replace function public.solicitar_devolucion(
  p_user_id uuid,
  p_order_id uuid,
  p_reason text,
  p_items jsonb -- [{ "order_item_id": "...", "qty": 1, "condition": "sellado" }, ...]
)
returns public.returns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_return public.returns;
  v_folio text;
  v_intentos int := 0;
  v_window_days int;
  v_item record;
  v_oi record;
  v_pct numeric(5, 2);
  v_ya_devuelto int;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Elige al menos un producto a devolver' using errcode = '22023';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Escribe el motivo de tu devolución' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id and user_id = p_user_id;
  if v_order.id is null then
    raise exception 'Ese pedido no existe o no te pertenece' using errcode = '42501';
  end if;
  if v_order.status <> 'entregado' then
    raise exception 'Solo puedes solicitar la devolución de un pedido ya entregado' using errcode = '22023';
  end if;

  select coalesce(value::int, 30) into v_window_days from public.settings where key = 'return_window_days';
  if v_order.delivered_at is null or now() > v_order.delivered_at + make_interval(days => v_window_days) then
    raise exception 'El plazo de % días para solicitar la devolución de este pedido ya venció', v_window_days
      using errcode = '22023';
  end if;

  -- Folio único (§9.2), mismo patrón de reintento que crear_pedido().
  loop
    v_intentos := v_intentos + 1;
    v_folio := public.generar_folio();
    begin
      insert into public.returns (folio, order_id, user_id, reason)
      values (v_folio, p_order_id, p_user_id, p_reason)
      returning * into v_return;
      exit;
    exception
      when unique_violation then
        if v_intentos >= 8 then
          raise exception 'No se pudo generar un folio único, intenta de nuevo' using errcode = '40001';
        end if;
    end;
  end loop;

  -- Partidas: cada order_item_id debe pertenecer al pedido, y la cantidad
  -- solicitada (sumando devoluciones previas no rechazadas de esa misma
  -- partida) no puede exceder lo comprado.
  for v_item in select * from jsonb_to_recordset(p_items) as x(order_item_id uuid, qty int, condition text) loop
    if v_item.condition not in ('sellado', 'abierto', 'otro') then
      raise exception 'Condición de producto inválida: %', v_item.condition using errcode = '22023';
    end if;
    if v_item.qty is null or v_item.qty <= 0 then
      raise exception 'Cantidad inválida' using errcode = '22023';
    end if;

    select * into v_oi from public.order_items where id = v_item.order_item_id and order_id = p_order_id;
    if v_oi.id is null then
      raise exception 'Ese producto no pertenece al pedido' using errcode = '42501';
    end if;

    select coalesce(sum(ri.qty), 0) into v_ya_devuelto
    from public.return_items ri
    join public.returns r on r.id = ri.return_id
    where ri.order_item_id = v_oi.id and r.status <> 'rechazada';

    if v_item.qty > v_oi.qty - v_ya_devuelto then
      raise exception 'Ya devolviste o solicitaste devolver más piezas de "%" de las que compraste', v_oi.name
        using errcode = '23514';
    end if;

    v_pct := case v_item.condition when 'sellado' then 100 when 'abierto' then 70 else 0 end; -- RN-6

    insert into public.return_items (return_id, order_item_id, qty, condition, percentage, percentage_suggested, credit_amount)
    values (
      v_return.id, v_oi.id, v_item.qty, v_item.condition, v_pct, v_pct,
      round(v_oi.unit_price * v_item.qty * v_pct / 100, 2)
    );
  end loop;

  return v_return;
end;
$$;

revoke execute on function public.solicitar_devolucion from public, anon, authenticated;
grant execute on function public.solicitar_devolucion to service_role;

-- resolver_devolucion: agrega la validación de rango/entero (10-100) que
-- antes no existía (el esquema viejo de 100/70/"otro" del cliente no
-- tenía piso) y marca `percentage_overridden` cuando el porcentaje final
-- difiere del sugerido de alguna partida.
create or replace function public.resolver_devolucion(
  p_return_id uuid,
  p_aprobar boolean,
  p_changed_by uuid,
  p_percentage numeric default null, -- OBLIGATORIO al aprobar (RN-6 modificada): entero 10-100
  p_resolution_note text default null, -- obligatorio si se rechaza (D2.4)
  p_reingresar_como_nuevo boolean default false -- D2.6: solo aplica si se aprueba
)
returns public.returns
language plpgsql
security definer
set search_path = public
as $$
declare
  v_return public.returns;
  v_monto_total numeric(12, 2) := 0;
  v_item record;
  v_overridden boolean := false;
begin
  select * into v_return from public.returns where id = p_return_id for update;
  if v_return.id is null then
    raise exception 'La devolución no existe' using errcode = 'P0002';
  end if;
  if v_return.status not in ('solicitada', 'en_revision') then
    raise exception 'Esta devolución ya fue resuelta (está en %)', v_return.status using errcode = '22023';
  end if;

  if not p_aprobar then
    if coalesce(trim(p_resolution_note), '') = '' then
      raise exception 'Escribe el motivo del rechazo — el cliente lo verá' using errcode = '22023';
    end if;

    update public.returns
    set status = 'rechazada', resolution_note = p_resolution_note, reviewed_by = p_changed_by, reviewed_at = now()
    where id = p_return_id
    returning * into v_return;

    insert into public.notification_outbox (event_type, channel, destino, payload)
    select 'devolucion.rechazada', 'correo', pr.email,
      jsonb_build_object('return_id', v_return.id, 'folio', v_return.folio, 'motivo', p_resolution_note)
    from public.profiles pr where pr.id = v_return.user_id;

    return v_return;
  end if;

  -- RN-6 modificada (P9): al aprobar, el porcentaje SIEMPRE lo elige el
  -- admin, entero entre 10 y 100 — nunca se confía solo en la validación
  -- del cliente (diseño-pagos-stripe.md §8), los mensajes coinciden con
  -- los del campo en pantalla a propósito.
  if p_percentage is null then
    raise exception 'Escribe un porcentaje entre 10 y 100' using errcode = '22023';
  end if;
  if p_percentage < 10 or p_percentage > 100 then
    raise exception 'El porcentaje debe estar entre 10%% y 100%%' using errcode = '22023';
  end if;
  if p_percentage <> trunc(p_percentage) then
    raise exception 'Usa un número entero, sin decimales' using errcode = '22023';
  end if;

  -- Aprobar: aplica el porcentaje elegido a cada partida (mismo criterio
  -- que 0018: un solo panel de "% a otorgar" por solicitud, no por
  -- partida), suma el monto total, marca si se apartó del sugerido, y
  -- reingresa a stock si se pidió (D2.6, solo "nueva").
  for v_item in
    select ri.id, ri.order_item_id, ri.qty, ri.percentage_suggested, oi.unit_price, oi.product_id
    from public.return_items ri
    join public.order_items oi on oi.id = ri.order_item_id
    where ri.return_id = p_return_id
  loop
    update public.return_items
    set percentage = p_percentage, credit_amount = round(v_item.unit_price * v_item.qty * p_percentage / 100, 2)
    where id = v_item.id;

    if p_percentage <> v_item.percentage_suggested then
      v_overridden := true;
    end if;

    if p_reingresar_como_nuevo then
      update public.products set stock = stock + v_item.qty where id = v_item.product_id;
    end if;
  end loop;

  v_monto_total := coalesce((select sum(credit_amount) from public.return_items where return_id = p_return_id), 0);

  update public.returns
  set status = 'aprobada', credit_amount = v_monto_total, reviewed_by = p_changed_by, reviewed_at = now(),
      percentage_overridden = v_overridden
  where id = p_return_id
  returning * into v_return;

  if v_monto_total > 0 then
    perform public.aplicar_saldo(
      v_return.user_id, v_monto_total, 'devolucion',
      'Devolución aprobada ' || v_return.folio, v_return.order_id, v_return.id, p_changed_by
    );
  end if;

  insert into public.notification_outbox (event_type, channel, destino, payload)
  select 'devolucion.aprobada', 'correo', pr.email,
    jsonb_build_object('return_id', v_return.id, 'folio', v_return.folio, 'monto', v_monto_total)
  from public.profiles pr where pr.id = v_return.user_id;

  return v_return;
end;
$$;

revoke execute on function public.resolver_devolucion from public, anon, authenticated;
grant execute on function public.resolver_devolucion to service_role;
