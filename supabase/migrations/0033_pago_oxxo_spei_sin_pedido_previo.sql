-- 0033_pago_oxxo_spei_sin_pedido_previo.sql
-- Épica P, corrección (2026-09-25). Al probar OXXO en producción, el mismo
-- defecto de 0032 apareció ahí: `iniciar_pago_stripe()` (0029) exige un
-- pedido YA creado, así que el checkout seguía creando el pedido (vaciando
-- el carrito) ANTES de intentar generar la ficha. Si Stripe rechazaba el
-- intento (en la prueba real: falta el nombre del cliente, RN aparte),
-- quedaba el mismo pedido huérfano y bucle que ya se corrigió para tarjeta.
--
-- Diferencia importante con tarjeta (0032): con tarjeta, "aceptado" =
-- pagado de verdad, así que el pedido nace directo en la cola de revisión.
-- Con OXXO/SPEI, "aceptado" solo significa que Stripe generó la ficha
-- (voucher/CLABE) — el pago real llega minutos u horas después por
-- webhook. El pedido nace en `pago_en_proceso` (aparta inventario, RN-13,
-- mismo criterio de siempre) y `registrar_pago_stripe()` (ya existente,
-- sin cambios) lo mueve a la cola de revisión cuando Stripe confirme.
--
-- Se generaliza `preparar_pago_tarjeta()`/`crear_pedido_desde_pago()` de
-- 0032 para los 3 métodos en vez de duplicar código.

-- ── 1. preparar_pago_stripe (reemplaza preparar_pago_tarjeta) ───────────
drop function if exists public.preparar_pago_tarjeta(uuid, jsonb, integer, uuid);

create function public.preparar_pago_stripe(
  p_user_id uuid,
  p_method text, -- 'tarjeta' | 'oxxo' | 'spei'
  p_checkout jsonb,
  p_amount_cents integer,
  p_idempotency_key uuid
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_producto record;
begin
  if p_method not in ('tarjeta', 'oxxo', 'spei') then
    raise exception 'Método de pago inválido: %', p_method using errcode = '22023';
  end if;

  select * into v_payment from public.payments
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if v_payment.id is not null then
    return v_payment;
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'El monto a cobrar debe ser mayor a cero.' using errcode = '22023';
  end if;
  if jsonb_array_length(coalesce(p_checkout -> 'items', '[]'::jsonb)) = 0 then
    raise exception 'Tu pedido está vacío. Agrega productos antes de continuar.' using errcode = '22023';
  end if;

  for v_producto in
    select p.name, p.status, (p.stock - p.reserved) as disponible, (elem ->> 'qty')::int as qty
    from jsonb_array_elements(p_checkout -> 'items') elem
    left join public.products p on p.id = (elem ->> 'product_id')::uuid
  loop
    if v_producto.name is null then
      raise exception 'Uno o más productos de tu pedido ya no existen. Actualiza tu carrito e intenta de nuevo.' using errcode = '22023';
    end if;
    if v_producto.status <> 'activo' then
      raise exception 'El producto % ya no está disponible', v_producto.name using errcode = '22023';
    end if;
    if v_producto.qty > v_producto.disponible then
      raise exception 'Solo quedan % piezas disponibles de %, tu pedido pide %. Ajusta la cantidad.',
        v_producto.disponible, v_producto.name, v_producto.qty using errcode = '23514';
    end if;
  end loop;

  insert into public.payments (order_id, user_id, method, amount_cents, idempotency_key, checkout, status)
  values (null, p_user_id, p_method, p_amount_cents, p_idempotency_key, p_checkout, 'iniciado')
  returning * into v_payment;

  return v_payment;
end;
$$;

revoke execute on function public.preparar_pago_stripe from public, anon, authenticated;
grant execute on function public.preparar_pago_stripe to service_role;

-- ── 2. crear_pedido_desde_pago: ahora sirve a los 3 métodos ─────────────
-- Tarjeta: llamarla solo cuando Stripe ya reporta el cargo `succeeded` —
-- eso decide el TypeScript que la invoca (verificando con la API de
-- Stripe), no esta función. Pedido nace en revisión (RN-11).
-- OXXO/SPEI: llamarla cuando Stripe ya generó la ficha (`p_instructions`
-- no nulo) — el pago en sí llega después por webhook. Pedido nace en
-- `pago_en_proceso` (RN-13, aparta inventario) y sigue el camino que
-- `registrar_pago_stripe()` ya maneja sin cambios.
--
-- Cambia de 3 a 5 parámetros respecto a 0032: DROP + CREATE, no
-- CREATE OR REPLACE (Postgres trata la lista de parámetros como parte de
-- la identidad de la función — con OR REPLACE quedarían las dos versiones
-- coexistiendo como sobrecargas, no una reemplazando a la otra).
drop function if exists public.crear_pedido_desde_pago(uuid, text, text);

create function public.crear_pedido_desde_pago(
  p_payment_id uuid,
  p_card_brand text default null,
  p_card_last4 text default null,
  p_instructions jsonb default null,
  p_expires_at timestamptz default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_order public.orders;
  v_target public.order_status;
  c jsonb;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then
    raise exception 'El pago % no existe', p_payment_id using errcode = 'P0002';
  end if;

  if v_payment.order_id is not null then
    select * into v_order from public.orders where id = v_payment.order_id;
    return v_order;
  end if;

  if v_payment.checkout is null then
    raise exception 'El pago % no tiene un checkout preparado', p_payment_id using errcode = '22023';
  end if;
  if v_payment.method in ('oxxo', 'spei') and p_instructions is null then
    raise exception 'Falta la ficha de % para crear el pedido', v_payment.method using errcode = '22023';
  end if;

  v_target := case when v_payment.method = 'tarjeta' then 'comprobante_recibido' else 'pago_en_proceso' end;
  c := v_payment.checkout;

  begin
    v_order := public.crear_pedido(
      v_payment.user_id,
      c -> 'items',
      c -> 'shipping_address',
      nullif(c -> 'billing_data', 'null'::jsonb),
      coalesce((c ->> 'wants_invoice')::boolean, false),
      coalesce((c ->> 'credit_to_apply')::numeric, 0),
      c ->> 'notes',
      v_payment.idempotency_key
    );

    update public.orders set payment_method = v_payment.method where id = v_order.id returning * into v_order;

    -- RN-11: tarjeta a la MISMA cola de revisión manual que comprobante;
    -- OXXO/SPEI a `pago_en_proceso`, mismo criterio que apartaba
    -- `iniciar_pago_stripe()` (0029) cuando el pedido ya existía.
    v_order := public.apartar_pedido(v_order.id, v_payment.user_id, 'stripe', v_target);

    update public.payments
    set order_id = v_order.id,
        status = case when v_payment.method = 'tarjeta' then 'pagado' else 'requiere_accion' end,
        card_brand = coalesce(p_card_brand, card_brand),
        card_last4 = coalesce(p_card_last4, card_last4),
        instructions = coalesce(p_instructions, instructions),
        expires_at = coalesce(p_expires_at, expires_at),
        needs_review = needs_review or (v_payment.method = 'tarjeta' and round(v_order.total * 100)::integer <> v_payment.amount_cents),
        ultimo_error = null
    where id = v_payment.id;

    return v_order;
  exception
    when others then
      update public.payments
      set status = 'revision', needs_review = true, ultimo_error = sqlerrm
      where id = v_payment.id;
      return null;
  end;
end;
$$;

revoke execute on function public.crear_pedido_desde_pago from public, anon, authenticated;
grant execute on function public.crear_pedido_desde_pago to service_role;
