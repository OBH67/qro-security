-- 0018_devoluciones_admin.sql
-- Panel admin — Devoluciones (D2). Resuelve una solicitud completa (todas
-- sus `return_items` juntas, como la maqueta trata una devolución: un
-- solo panel de "% a otorgar" por solicitud, no por partida).
--
-- Reingreso al catálogo (D2.6/D2.7, PA-10, decisión 2026-09-20):
-- "sellado" reingresa como producto NUEVO (+cantidad al stock del SKU
-- original, mismo precio); "abierto"/"usado"/"otro" se publica aparte
-- como ficha "Usado" — eso es una acción EXPLÍCITA y manual del admin
-- (abre el editor de producto ya construido en F1, precargado desde esta
-- devolución), nunca automática — esta función solo resuelve la
-- devolución y, si se pidió, reingresa como nuevo; no crea la ficha de
-- "Usado" por sí sola.

create function public.resolver_devolucion(
  p_return_id uuid,
  p_aprobar boolean,
  p_changed_by uuid,
  p_percentage numeric default null, -- D2.2: si se corrige el % propuesto; null = usa el ya guardado por partida
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

  -- Aprobar: recalcula cada partida si se corrigió el porcentaje, suma el
  -- monto total, y reingresa a stock si se pidió (D2.6, solo "nueva").
  for v_item in
    select ri.id, ri.order_item_id, ri.qty, oi.unit_price, oi.product_id
    from public.return_items ri
    join public.order_items oi on oi.id = ri.order_item_id
    where ri.return_id = p_return_id
  loop
    if p_percentage is not null then
      update public.return_items
      set percentage = p_percentage, credit_amount = round(v_item.unit_price * v_item.qty * p_percentage / 100, 2)
      where id = v_item.id;
    end if;

    if p_reingresar_como_nuevo then
      update public.products set stock = stock + v_item.qty where id = v_item.product_id;
    end if;
  end loop;

  v_monto_total := coalesce((select sum(credit_amount) from public.return_items where return_id = p_return_id), 0);

  update public.returns
  set status = 'aprobada', credit_amount = v_monto_total, reviewed_by = p_changed_by, reviewed_at = now()
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
