-- 0005_devoluciones_y_saldo.sql
-- Saldo a favor (libro de movimientos, D2) y devoluciones (D6).
-- Ver `.devsquad/modelo-datos.md` §4.4.

create table public.returns (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  order_id uuid not null references public.orders (id),
  user_id uuid not null references public.profiles (id),
  status text not null default 'solicitada'
    check (status in ('solicitada', 'en_revision', 'aprobada', 'rechazada')),
  reason text not null,
  credit_amount numeric(12, 2), -- se llena al resolver
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create index returns_order_id_idx on public.returns (order_id);
create index returns_user_id_idx on public.returns (user_id);
create index returns_status_idx on public.returns (status);

-- Ahora que `returns` existe, se cierra la referencia que quedó pendiente
-- en 0003_catalogo.sql: de qué devolución viene una ficha de producto
-- "Usado" (D6).
alter table public.products
  add constraint products_source_return_id_fkey
  foreign key (source_return_id) references public.returns (id);

create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id),
  qty int not null check (qty > 0),
  condition text not null check (condition in ('sellado', 'abierto', 'otro')), -- RN-6
  percentage numeric(5, 2) not null check (percentage >= 0 and percentage <= 100),
  credit_amount numeric(12, 2) not null check (credit_amount >= 0)
);

create index return_items_return_id_idx on public.return_items (return_id);

create table public.return_photos (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns (id) on delete cascade,
  url text not null -- bucket privado de R2
);

create index return_photos_return_id_idx on public.return_photos (return_id);

-- Libro de movimientos de saldo (D2): el saldo del cliente es
-- SUM(amount) WHERE user_id = ?, nunca un contador editado a mano.
create table public.credit_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id),
  amount numeric(12, 2) not null, -- positivo abona, negativo aplica
  kind text not null check (kind in ('devolucion', 'aplicado', 'ajuste')),
  order_id uuid references public.orders (id),
  return_id uuid references public.returns (id),
  description text not null,
  created_by uuid references public.profiles (id), -- nulo si lo generó el sistema
  created_at timestamptz not null default now()
);

create index credit_movements_user_id_idx on public.credit_movements (user_id);
