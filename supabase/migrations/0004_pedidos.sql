-- 0004_pedidos.sql
-- Pedidos, partidas, historial de estado, comprobantes y el token de
-- confirmación por correo. Ver `.devsquad/modelo-datos.md` §4.3.

create type public.order_status as enum (
  'pendiente_pago',
  'comprobante_recibido',
  'listo_envio',
  'enviado',
  'entregado',
  'cancelado'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique, -- SGQ-7K4M2X, generado por 0008 (§9.2)
  user_id uuid not null references public.profiles (id),
  status public.order_status not null default 'pendiente_pago',
  -- RN-11 / D. saldo_completo: sin comprobante, pero igual entra a revisión
  -- humana (nunca avanza automático).
  payment_method text not null check (payment_method in ('transferencia', 'saldo_completo')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  credit_applied numeric(12, 2) not null default 0 check (credit_applied >= 0),
  shipping_cost numeric(12, 2), -- nulo hasta que el asesor lo confirma al enviar
  total numeric(12, 2) not null check (total >= 0),
  wants_invoice boolean not null default false,
  shipping_address jsonb not null, -- copia congelada (D3)
  billing_data jsonb, -- copia congelada, nulo si no pidió factura
  notes text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_folio_idx on public.orders (folio);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  sku text not null, -- copia congelada (D3)
  name text not null, -- copia congelada (D3)
  unit_price numeric(12, 2) not null check (unit_price >= 0), -- precio al comprar (D3)
  qty int not null check (qty > 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

-- Auditoría de estado: base de G1/G2 (analítica de tiempos entre estados).
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  from_status public.order_status, -- nulo en la creación
  to_status public.order_status not null,
  changed_by uuid references public.profiles (id), -- nulo si vino del enlace por correo
  source text not null check (source in ('panel', 'correo', 'sistema')),
  note text,
  changed_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id);

create table public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  file_url text not null, -- imagen o PDF en el bucket privado de R2
  transfer_date date not null,
  amount numeric(12, 2) not null check (amount >= 0),
  origin_bank text,
  spei_tracking_key text,
  status text not null default 'pendiente' check (status in ('pendiente', 'validado', 'rechazado')),
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  rejection_reason text,
  uploaded_at timestamptz not null default now()
);

create index payment_proofs_order_id_idx on public.payment_proofs (order_id);

-- Enlace de confirmación de pago por correo (§9.3): un solo uso, con
-- vencimiento, guardado como hash — nunca un enlace predecible.
create table public.payment_confirmation_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  token_hash text not null unique, -- SHA-256(token + PAYMENT_TOKEN_PEPPER)
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index payment_confirmation_tokens_order_id_idx on public.payment_confirmation_tokens (order_id);

-- ── Adiciones de arquitectura (arquitectura.md §5) ─────────────────────────

-- carts / cart_items (§9.6): el carrito de un visitante sin sesión vive en
-- localStorage; con sesión iniciada sobrevive al cambio de dispositivo.
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id),
  qty int not null check (qty > 0),
  added_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index cart_items_cart_id_idx on public.cart_items (cart_id);

-- notification_outbox (§7.3): patrón outbox — se inserta en la misma
-- transacción que cambia el estado del pedido; si la transacción se
-- revierte, la notificación desaparece con ella. El despachador la procesa
-- después del commit y el cron de reintentos la reintenta hasta 5 veces.
create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null, -- 'comprobante.recibido', 'pedido.enviado', …
  channel text not null check (channel in ('correo', 'whatsapp')),
  destino text not null, -- correo o número de destino
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'enviado', 'fallido', 'agotado')),
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notification_outbox_status_idx on public.notification_outbox (status);
