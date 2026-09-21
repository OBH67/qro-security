-- 0012_devoluciones.sql
-- Épica D del lado del cliente: D1 (solicitar devolución). El folio y la
-- elegibilidad (pedido entregado, dentro del plazo, cantidades que no
-- exceden lo comprado) son reglas de servidor, mismo criterio que
-- crear_pedido() (0010): generar_folio() es service_role-only y la
-- ventana de tiempo es una regla de negocio, no algo que el cliente
-- declare por su cuenta.
--
-- D2 (aprobar/rechazar desde el panel, abonar el saldo real vía
-- aplicar_saldo()) es Épica H (panel admin) — fuera de este incremento.
-- Por eso return_items guarda un porcentaje/crédito ESTIMADO según RN-6
-- (100% sellado, 70% abierto, 0 para "otro" — ahí no hay estimado
-- automático, "lo revisa un asesor", D1.4) al momento de solicitar; el
-- admin lo corrige o confirma al resolver. `returns.credit_amount` (el
-- monto final) se queda NULL hasta entonces, tal como ya documentaba el
-- comentario de la tabla en 0005.

create function public.solicitar_devolucion(
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

    insert into public.return_items (return_id, order_item_id, qty, condition, percentage, credit_amount)
    values (
      v_return.id, v_oi.id, v_item.qty, v_item.condition, v_pct,
      round(v_oi.unit_price * v_item.qty * v_pct / 100, 2)
    );
  end loop;

  return v_return;
end;
$$;

revoke execute on function public.solicitar_devolucion from public, anon, authenticated;
grant execute on function public.solicitar_devolucion to service_role;
