-- 0010_pedidos_carrito_b_c.sql
-- Incremento Épica B (carrito y cuenta) + Épica C sin C3 (pedido, pago por
-- transferencia y comprobante). Añade las dos funciones transaccionales que
-- 0008 no cubría porque en esa fase todavía no existía el flujo de compra:
--
-- - crear_pedido(): congela precios (D3), valida disponible, genera folio
--   único (RN-3), aplica saldo si se manda (D3, aunque su origen —
--   Épica D, devoluciones— no es parte de este incremento: la función ya
--   queda lista para cuando exista), y para pedidos que el saldo cubre al
--   100% (`total = 0`) los mueve de inmediato a `comprobante_recibido`
--   reutilizando `apartar_pedido()` — mismo criterio de revisión humana
--   (RN-11), sin comprobante que subir.
-- - confirmar_comprobante(): inserta el comprobante y aparta las piezas en
--   una sola transacción, reusando `apartar_pedido()` (§9.1) para el mismo
--   candado de concurrencia que ya existe.
--
-- Ambas son SECURITY DEFINER, invocadas por RPC solo desde
-- `src/server/db/mutations/` con el cliente service_role — igual que las de
-- 0008 (arquitectura.md §6.1: los cambios de estado y el apartado de stock
-- nunca se escriben desde el navegador).

-- ────────────────────────────────────────────────────────────────────────
-- crear_pedido: congela precios, valida disponible, genera folio, aplica
-- saldo opcional, crea el pedido + partidas + primer renglón de bitácora,
-- vacía el carrito del cliente.
-- ────────────────────────────────────────────────────────────────────────
create function public.crear_pedido(
  p_user_id uuid,
  p_items jsonb, -- [{ "product_id": "...", "qty": 2 }, ...]
  p_shipping_address jsonb,
  p_billing_data jsonb default null,
  p_wants_invoice boolean default false,
  p_credit_to_apply numeric default 0,
  p_notes text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_folio text;
  v_subtotal numeric(12, 2) := 0;
  v_credit_applied numeric(12, 2) := 0;
  v_total numeric(12, 2);
  v_payment_method text;
  v_item record;
  v_producto record;
  v_intentos int := 0;
  v_cart_id uuid;
  v_productos_encontrados int := 0;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos' using errcode = '22023';
  end if;

  -- Todo product_id de p_items debe existir de verdad: si uno no aparece en
  -- `products` (borrado, id mal formado), la partida se perdería en
  -- silencio en el paso 4 en vez de fallar con un mensaje claro.
  select count(*) into v_productos_encontrados
  from public.products p
  where p.id in (select (elem ->> 'product_id')::uuid from jsonb_array_elements(p_items) elem);
  if v_productos_encontrados <> jsonb_array_length(p_items) then
    raise exception 'Uno o más productos de tu pedido ya no existen. Actualiza tu carrito e intenta de nuevo.'
      using errcode = '22023';
  end if;

  -- 1. Bloquear los productos involucrados, SIEMPRE ordenados por id (mismo
  --    criterio anti-interbloqueo que apartar_pedido, §9.1), y congelar
  --    precio + validar disponible en el mismo paso.
  for v_producto in
    select p.id, p.sku, p.name, p.price, p.status, (p.stock - p.reserved) as disponible,
           (select (elem ->> 'qty')::int
              from jsonb_array_elements(p_items) elem
             where (elem ->> 'product_id')::uuid = p.id) as qty
    from public.products p
    where p.id in (select (elem ->> 'product_id')::uuid from jsonb_array_elements(p_items) elem)
    order by p.id
    for update
  loop
    if v_producto.status <> 'activo' then
      raise exception 'El producto % ya no está disponible', v_producto.name using errcode = '22023';
    end if;
    if v_producto.qty is null or v_producto.qty <= 0 then
      raise exception 'Cantidad inválida para %', v_producto.name using errcode = '22023';
    end if;
    if v_producto.qty > v_producto.disponible then
      raise exception 'Solo quedan % piezas disponibles de %, tu pedido pide %. Ajusta la cantidad.',
        v_producto.disponible, v_producto.name, v_producto.qty
        using errcode = '23514';
    end if;
    v_subtotal := v_subtotal + (v_producto.price * v_producto.qty);
  end loop;

  -- 2. Saldo a favor (D3 — origen fuera de este incremento, la función ya
  --    queda lista). Nunca más que el subtotal ni más de lo que el cliente
  --    tiene: aplicar_saldo() valida lo segundo con su propio candado.
  v_credit_applied := least(coalesce(p_credit_to_apply, 0), v_subtotal);
  v_total := v_subtotal - v_credit_applied;
  v_payment_method := case when v_total = 0 then 'saldo_completo' else 'transferencia' end;

  -- 3. Folio único (§9.2): reintenta ante colisión de UNIQUE (improbable).
  loop
    v_intentos := v_intentos + 1;
    v_folio := public.generar_folio();
    begin
      insert into public.orders (
        folio, user_id, status, payment_method, subtotal, credit_applied,
        total, wants_invoice, shipping_address, billing_data, notes
      ) values (
        v_folio, p_user_id, 'pendiente_pago', v_payment_method, v_subtotal, v_credit_applied,
        v_total, coalesce(p_wants_invoice, false), p_shipping_address, p_billing_data, p_notes
      )
      returning * into v_order;
      exit;
    exception
      when unique_violation then
        if v_intentos >= 8 then
          raise exception 'No se pudo generar un folio único, intenta de nuevo' using errcode = '40001';
        end if;
    end;
  end loop;

  -- 4. Partidas, con precio y nombre congelados (D3).
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, qty int) loop
    insert into public.order_items (order_id, product_id, sku, name, unit_price, qty, subtotal)
    select v_order.id, p.id, p.sku, p.name, p.price, v_item.qty, p.price * v_item.qty
    from public.products p
    where p.id = v_item.product_id;
  end loop;

  -- 5. Primer renglón de bitácora (creación).
  insert into public.order_status_history (order_id, from_status, to_status, changed_by, source)
  values (v_order.id, null, 'pendiente_pago', p_user_id, 'cliente');

  -- 6. Aplicar saldo, si se pidió. aplicar_saldo() ya valida que no quede
  --    negativo (RN-7) y serializa por cliente — si no alcanza, revierte
  --    TODO el pedido (D3.5: aplicación atómica).
  if v_credit_applied > 0 then
    perform public.aplicar_saldo(
      p_user_id, -v_credit_applied, 'aplicado',
      'Aplicado al pedido ' || v_folio, v_order.id, null, p_user_id
    );
  end if;

  -- 7. Saldo cubre el 100%: no hay comprobante que subir, pero el pedido
  --    igual entra a la bandeja de revisión humana (RN-11, D3.3) —
  --    reutiliza apartar_pedido() para apartar las piezas y notificar.
  if v_total = 0 then
    v_order := public.apartar_pedido(v_order.id, p_user_id, 'cliente');
  end if;

  -- 8. Vaciar el carrito del cliente (el pedido ya se generó).
  select id into v_cart_id from public.carts where user_id = p_user_id;
  if v_cart_id is not null then
    delete from public.cart_items where cart_id = v_cart_id;
  end if;

  return v_order;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- confirmar_comprobante: inserta el comprobante (C2.1-C2.3) y aparta las
-- piezas en la misma transacción, reusando apartar_pedido() (§9.1).
-- ────────────────────────────────────────────────────────────────────────
create function public.confirmar_comprobante(
  p_order_id uuid,
  p_user_id uuid, -- quien sube (para changed_by y para exigir que sea el dueño)
  p_file_url text,
  p_transfer_date date,
  p_amount numeric,
  p_origin_bank text default null,
  p_spei_tracking_key text default null
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
  if v_order.user_id <> p_user_id then
    raise exception 'Este pedido no te pertenece' using errcode = '42501';
  end if;
  if v_order.payment_method <> 'transferencia' then
    raise exception 'Este pedido no requiere comprobante' using errcode = '22023';
  end if;

  -- C2.5: reemplazable mientras no se haya validado. Si ya había uno
  -- pendiente, se sustituye (el pedido sigue en pendiente_pago hasta este
  -- punto); si el pedido ya avanzó de pendiente_pago, apartar_pedido()
  -- abajo lo rechaza con un error claro.
  if v_order.status = 'pendiente_pago' then
    delete from public.payment_proofs where order_id = p_order_id and status = 'pendiente';
  end if;

  insert into public.payment_proofs (
    order_id, file_url, transfer_date, amount, origin_bank, spei_tracking_key
  ) values (
    p_order_id, p_file_url, p_transfer_date, p_amount, p_origin_bank, p_spei_tracking_key
  );

  v_order := public.apartar_pedido(p_order_id, p_user_id, 'cliente');
  return v_order;
end;
$$;

revoke execute on function public.crear_pedido from public, anon, authenticated;
revoke execute on function public.confirmar_comprobante from public, anon, authenticated;
grant execute on function public.crear_pedido to service_role;
grant execute on function public.confirmar_comprobante to service_role;
