-- 0011_idempotencia_pedidos.sql
-- Cierra un hueco de seguridad/integridad real: `crear_pedido()` no tenía
-- ninguna protección contra pedidos duplicados por doble clic, reintento de
-- red, o el mismo cliente confirmando el mismo carrito en dos pestañas.
--
-- El candado de `apartar_pedido()`/`marcar_enviado()` (0008, §9.1) protege
-- el STOCK entre pedidos de clientes DISTINTOS que compiten por el mismo
-- producto — no protege contra que el MISMO cliente cree dos pedidos por el
-- mismo carrito. Este incremento agrega esa segunda garantía, en dos capas
-- (arquitectura.md no documentaba ninguna de las dos, es una omisión real):
--
-- 1. Llave de idempotencia: el cliente genera un UUID v4 una sola vez al
--    entrar a /pagar (ver CheckoutForm.tsx) y lo manda en cada intento.
--    Único por CLIENTE, no global (`(user_id, idempotency_key)`), porque la
--    llave la genera el cliente, no el servidor: dos clientes distintos
--    podrían —en la práctica nunca, pero el criterio correcto es este—
--    coincidir en un UUID.
-- 2. Candado transaccional por cliente (`pg_advisory_xact_lock`, mismo
--    patrón que `aplicar_saldo()` en 0008): cierra la ventana de carrera
--    real donde dos llamadas concurrentes llegan al "¿ya existe?" antes de
--    que la primera haga commit — sin este candado, la sola llave de
--    idempotencia no basta bajo concurrencia genuina (fenómeno clásico de
--    doble inserción).
--
-- Decisión técnica (no es una pregunta abierta, es defendible por sí
-- misma): la llave nunca expira y es 1:1 con "un intento de checkout". Un
-- carrito idéntico comprado de nuevo genuinamente genera una llave nueva
-- porque el usuario volvió a entrar a /pagar (la pantalla genera una llave
-- nueva en cada montaje del componente; sobrevive a clics repetidos dentro
-- de la misma pantalla, pero NO a un refresh, porque un refresh es, para
-- efectos de este negocio, un nuevo intento de compra).

-- ────────────────────────────────────────────────────────────────────────
-- 0. Bug preexistente encontrado al probar este incremento contra Postgres
--    real (no introducido aquí, pero bloqueaba la prueba de concurrencia
--    que este mismo incremento pide correr — se corrige en el mismo lugar
--    donde se detectó, documentado en `.devsquad/estado.md`):
--    `crear_pedido()` y `confirmar_comprobante()` (0010) insertan
--    `source = 'cliente'` en `order_status_history`, pero el CHECK de esa
--    columna (0004) solo permitía `'panel' | 'correo' | 'sistema'` — es
--    decir, TODA llamada real a `crear_pedido()` fallaba desde 0010, nunca
--    se había probado contra un Postgres real (ver nota de `estado.md` del
--    incremento anterior: "no se pudo validar... contra un Postgres
--    real"). Se agrega `'cliente'` a los valores permitidos.
-- ────────────────────────────────────────────────────────────────────────
alter table public.order_status_history
  drop constraint order_status_history_source_check;
alter table public.order_status_history
  add constraint order_status_history_source_check
  check (source in ('panel', 'correo', 'sistema', 'cliente'));

-- ────────────────────────────────────────────────────────────────────────
-- 1. Columna + índice único compuesto por cliente.
-- ────────────────────────────────────────────────────────────────────────
alter table public.orders
  add column idempotency_key uuid;

-- Único por (user_id, idempotency_key), NO global. Postgres ya trata NULL
-- como distinto de cualquier otro NULL en un índice único, así que llamadas
-- internas/de prueba que no manden llave (p_idempotency_key = null) pueden
-- seguir creando tantos pedidos como quieran sin chocar entre sí.
create unique index orders_user_idempotency_key_idx
  on public.orders (user_id, idempotency_key)
  where idempotency_key is not null;

comment on column public.orders.idempotency_key is
  'UUID generado por el cliente al entrar a /pagar (CheckoutForm). Hace que crear_pedido() sea idempotente: repetir la misma llamada con la misma llave nunca duplica el pedido. Único por cliente, no global.';

-- ────────────────────────────────────────────────────────────────────────
-- 2. crear_pedido(): candado por cliente + verificación de idempotencia
--    ANTES de bloquear productos. CREATE OR REPLACE con un parámetro nuevo
--    al final, con default null: las llamadas existentes sin llave (si las
--    hubiera) siguen funcionando igual que antes — solo se vuelve
--    obligatoria desde `generarPedidoAction` hacia adelante (capa de
--    aplicación, no de base de datos).
--
--    Nota técnica: agregar un parámetro nuevo cambia la lista de tipos de
--    la función para Postgres (aunque tenga default), así que
--    `CREATE OR REPLACE` NO sustituye la versión de 7 parámetros de 0010 —
--    crearía un overload adicional. Se elimina explícitamente la firma
--    vieja primero.
-- ────────────────────────────────────────────────────────────────────────
drop function if exists public.crear_pedido(uuid, jsonb, jsonb, jsonb, boolean, numeric, text);

create or replace function public.crear_pedido(
  p_user_id uuid,
  p_items jsonb, -- [{ "product_id": "...", "qty": 2 }, ...]
  p_shipping_address jsonb,
  p_billing_data jsonb default null,
  p_wants_invoice boolean default false,
  p_credit_to_apply numeric default 0,
  p_notes text default null,
  p_idempotency_key uuid default null
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
  -- 0a. Candado transaccional por cliente (mismo patrón que aplicar_saldo,
  --     0008): serializa las llamadas a crear_pedido() del MISMO cliente.
  --     Sin esto, dos llamadas concurrentes con la misma llave podrían
  --     ambas llegar al SELECT de idempotencia de 0b antes de que la
  --     primera haga commit, y ambas concluir "no existe" y crear su propio
  --     pedido — la llave sola no cierra esa ventana de carrera.
  --     Se toma SIEMPRE, no solo cuando viene llave, para que el mismo
  --     candado sirva también si el futuro backend de saldo (D3) necesita
  --     serializar por cliente aquí, igual que ya lo hace aplicar_saldo().
  perform pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- 0b. Idempotencia: si ya existe un pedido de este cliente con esta
  --     llave, se regresa TAL CUAL en vez de crear uno nuevo — mismo
  --     comportamiento que si se acabara de crear (mismo folio, mismo
  --     total, etc.). Repetir la llamada nunca duplica el pedido.
  if p_idempotency_key is not null then
    select * into v_order
    from public.orders
    where user_id = p_user_id and idempotency_key = p_idempotency_key;

    if v_order.id is not null then
      return v_order;
    end if;
  end if;

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
        total, wants_invoice, shipping_address, billing_data, notes, idempotency_key
      ) values (
        v_folio, p_user_id, 'pendiente_pago', v_payment_method, v_subtotal, v_credit_applied,
        v_total, coalesce(p_wants_invoice, false), p_shipping_address, p_billing_data, p_notes, p_idempotency_key
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
-- 3. confirmar_comprobante(): revisado el mismo riesgo (dos subidas
--    simultáneas del mismo comprobante insertando dos filas en
--    payment_proofs antes de que el DELETE de la primera sea visible a la
--    segunda). Veredicto: la función YA estaba protegida, sin necesitar
--    cambios — se deja documentado aquí para que quede explícito, en vez
--    de silencioso:
--
--    `select * into v_order from public.orders where id = p_order_id
--    for update;` es la PRIMERA línea del cuerpo de confirmar_comprobante
--    (0010). Eso ya bloquea la fila del pedido: una segunda llamada
--    concurrente para el MISMO pedido espera a que la primera haga commit
--    antes de poder leer su propio v_order. Cuando por fin puede seguir,
--    ve el pedido ya en 'comprobante_recibido' (no 'pendiente_pago'), así
--    que:
--      a) NO borra el comprobante recién insertado por la primera llamada
--         (el `delete ... where status = 'pendiente'` solo corre si
--         `v_order.status = 'pendiente_pago'`),
--      b) SÍ inserta una segunda fila en payment_proofs (aparente
--         duplicado)...
--      c) ...pero acto seguido llama a apartar_pedido(p_order_id, ...),
--         que exige `status = 'pendiente_pago'` y, al no cumplirse,
--         lanza una excepción — lo que revierte TODA la transacción,
--         incluida la fila "duplicada" de payment_proofs.
--    Resultado neto verificado con una prueba de concurrencia real (ver
--    notas de prueba en `.devsquad/estado.md`): nunca queda más de un
--    comprobante insertado por pedido. Se agrega, de cualquier forma, un
--    candado advisory explícito por pedido — no porque haga falta para la
--    corrección (el FOR UPDATE de arriba ya la garantiza), sino por
--    consistencia con el patrón del resto del archivo y para que la
--    segunda llamada falle más rápido y con un mensaje de negocio más
--    claro en vez de esperar el error de estado de apartar_pedido().
-- ────────────────────────────────────────────────────────────────────────
create or replace function public.confirmar_comprobante(
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
  -- Candado explícito por pedido (defensa en profundidad — ver nota
  -- arriba: el FOR UPDATE de abajo ya serializa por sí solo).
  perform pg_advisory_xact_lock(hashtext(p_order_id::text));

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
  if v_order.status <> 'pendiente_pago' then
    raise exception 'Este pedido ya no está pendiente de comprobante.' using errcode = '22023';
  end if;

  -- C2.5: reemplazable mientras no se haya validado. Si ya había uno
  -- pendiente, se sustituye.
  delete from public.payment_proofs where order_id = p_order_id and status = 'pendiente';

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
