-- 0028_pagos_stripe_esquema.sql
-- Épica P — Pagos con Stripe (tarjeta, OXXO, SPEI). Primera de dos
-- migraciones: aquí solo el esquema ADITIVO (tablas nuevas, columnas
-- nuevas, el valor nuevo del enum order_status, checks extendidos).
--
-- La segunda migración (0029_pagos_stripe_funciones.sql) trae las
-- funciones PL/pgSQL que USAN el literal 'pago_en_proceso'. Tienen que ir
-- separadas: Postgres no permite usar un valor de enum recién agregado
-- con `ALTER TYPE ... ADD VALUE` dentro de la MISMA transacción en que se
-- agregó (sigue así incluso en versiones recientes — solo se permitió
-- ejecutar el ALTER TYPE dentro de un bloque de transacción, no usar el
-- valor ahí mismo), y la CLI de Supabase aplica cada archivo de migración
-- como una sola transacción.
--
-- Ver `.devsquad/arquitectura-pagos-stripe.md` §3 y §6, y
-- `.devsquad/requerimientos-pagos-stripe.md` RN-13 a RN-16.

-- ────────────────────────────────────────────────────────────────────────
-- 1. Nuevo estado de pedido: pago_en_proceso (arquitectura §3). Se usa
--    mientras el cliente paga con tarjeta/OXXO/SPEI, antes de que Stripe
--    confirme — NO se usa en esta misma migración (ver nota arriba).
-- ────────────────────────────────────────────────────────────────────────
alter type public.order_status add value if not exists 'pago_en_proceso';

-- ────────────────────────────────────────────────────────────────────────
-- 2. orders.payment_method: + tarjeta/oxxo/spei (arquitectura §6). El
--    método real se fija cuando el cliente elige cómo pagar (P1), no al
--    crear el pedido — `crear_pedido()` sigue asumiendo 'transferencia'
--    por defecto (o 'saldo_completo' si el saldo cubre el 100%);
--    `iniciar_pago_stripe()` (0029) lo corrige al iniciar el intento.
-- ────────────────────────────────────────────────────────────────────────
alter table public.orders drop constraint orders_payment_method_check;
alter table public.orders add constraint orders_payment_method_check
  check (payment_method in ('transferencia', 'saldo_completo', 'tarjeta', 'oxxo', 'spei'));

-- ────────────────────────────────────────────────────────────────────────
-- 3. order_status_history.source: + 'stripe' — quien mueve el pedido de
--    pago_en_proceso a comprobante_recibido (o lo libera) es el webhook,
--    no un humano en el panel ni el propio cliente (arquitectura §6).
-- ────────────────────────────────────────────────────────────────────────
alter table public.order_status_history drop constraint order_status_history_source_check;
alter table public.order_status_history add constraint order_status_history_source_check
  check (source in ('panel', 'correo', 'sistema', 'cliente', 'stripe'));

-- ────────────────────────────────────────────────────────────────────────
-- 4. profiles.stripe_customer_id: nulo hasta el primer uso. Solo SPEI
--    (customer_balance + bank_transfer.type=mx_bank_transfer) exige un
--    Stripe Customer; tarjeta y OXXO nunca lo necesitan (arquitectura §6).
-- ────────────────────────────────────────────────────────────────────────
alter table public.profiles add column stripe_customer_id text unique;

-- ────────────────────────────────────────────────────────────────────────
-- 5. payments: una fila por intento de pago con Stripe (arquitectura §6).
--    `instructions` nunca contiene datos de tarjeta (PCI SAQ A) — solo
--    voucher OXXO o CLABE SPEI, que ya son públicos/no sensibles.
-- ────────────────────────────────────────────────────────────────────────
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  method text not null check (method in ('tarjeta', 'oxxo', 'spei')),
  provider text not null default 'stripe' check (provider = 'stripe'),
  stripe_payment_intent_id text unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'mxn',
  status text not null default 'iniciado' check (status in (
    'iniciado', 'requiere_accion', 'procesando', 'pagado', 'fallido',
    'vencido', 'cancelado', 'revision'
  )),
  expires_at timestamptz,
  instructions jsonb,
  card_brand text,
  card_last4 text,
  -- Idempotencia del intento (mismo criterio que orders.idempotency_key,
  -- 0011): un UUID generado por el cliente al entrar al paso de pago.
  idempotency_key uuid not null,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, idempotency_key)
);

create index payments_order_id_idx on public.payments (order_id);
create index payments_status_idx on public.payments (status);
create index payments_needs_review_idx on public.payments (needs_review) where needs_review;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────
-- 6. stripe_webhook_events: idempotencia de webhooks (P5.2). `event_id`
--    como PK: un `insert ... on conflict (event_id) do nothing` desde la
--    función que procesa el evento (0029, registrar_pago_stripe()) basta
--    para no reprocesar un reintento de Stripe.
-- ────────────────────────────────────────────────────────────────────────
create table public.stripe_webhook_events (
  event_id text primary key,
  type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  result text,
  error text
);

create index stripe_webhook_events_type_idx on public.stripe_webhook_events (type);

-- ────────────────────────────────────────────────────────────────────────
-- 7. Settings H4: plazo configurable (1-3 días) del apartado por OXXO/SPEI
--    (arquitectura §4). `actualizar_configuracion()` (0019) ya sirve para
--    editarlos desde el panel sin código nuevo.
-- ────────────────────────────────────────────────────────────────────────
insert into public.settings (key, value) values
  ('oxxo_expires_days', '2'),
  ('spei_expires_days', '2')
on conflict (key) do nothing;

-- ────────────────────────────────────────────────────────────────────────
-- 8. RLS (arquitectura §6): el cliente lee sus propios pagos (voucher/
--    CLABE en "Mis pedidos"), nunca escribe — toda escritura pasa por
--    Route Handlers/Server Actions con `service_role`.
--    `stripe_webhook_events` es infraestructura interna del webhook,
--    mismo criterio que `notification_outbox` (0007): sin acceso de
--    cliente, admin solo lectura.
-- ────────────────────────────────────────────────────────────────────────
alter table public.payments enable row level security;
create policy payments_select_own on public.payments
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

alter table public.stripe_webhook_events enable row level security;
create policy stripe_webhook_events_admin_read on public.stripe_webhook_events
  for select to authenticated using (public.is_admin());
