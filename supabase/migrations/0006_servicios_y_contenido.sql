-- 0006_servicios_y_contenido.sql
-- Solicitudes de servicio (leads) y contenido editorial/configuración.
-- Ver `.devsquad/modelo-datos.md` §4.5 y §4.6.

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  folio text not null unique,
  service_type text not null check (service_type in ('monitoreo', 'guardias', 'financiamiento')),
  client_type text not null check (client_type in ('particular', 'negocio', 'empresa')),
  full_name text not null,
  phone text not null,
  email text not null,
  state text not null,
  municipality text not null,
  neighborhood text,
  address_reference text,
  property_type text not null
    check (property_type in ('casa', 'local', 'oficina', 'bodega', 'industria', 'otro')),
  preferred_time text,
  amount numeric(12, 2), -- solo financiamiento
  term_months int, -- solo financiamiento: 3, 6, 12
  message text,
  status text not null default 'nueva' check (status in ('nueva', 'contactada', 'cerrada')),
  assigned_to uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index service_requests_status_idx on public.service_requests (status);
create index service_requests_service_type_idx on public.service_requests (service_type);

-- Configuración editable por el admin sin desplegar código (H4). Llave/valor
-- para no migrar el esquema cada vez que se agrega un parámetro operativo.
create table public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id)
);

create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- Valores iniciales: llaves que la aplicación espera encontrar siempre,
-- aunque el valor real lo llene el admin desde el panel (H4). El contenido
-- real (CLABE, WhatsApp, etc.) NUNCA se hardcodea aquí ni en el código.
insert into public.settings (key, value) values
  ('bank_name', null),
  ('beneficiary', null),
  ('clabe', null),
  ('account_number', null),
  ('admin_whatsapp', null),
  ('admin_email', null),
  ('order_folio_prefix', 'SGQ'),
  ('return_window_days', '30'),
  ('order_auto_cancel_days', '3'),
  ('credit_expiry_days', null);

create table public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  brand_label text,
  image_url text not null,
  group_id uuid references public.groups (id),
  gradient_from text,
  gradient_to text,
  position int not null default 0,
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz
);

create index banners_active_idx on public.banners (active);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products (id),
  user_id uuid references public.profiles (id),
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  category text,
  title text,
  body text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create index reviews_product_id_idx on public.reviews (product_id);
create index reviews_published_idx on public.reviews (published);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('general', 'servicios', 'devoluciones', 'como_comprar')),
  topic text,
  question text not null,
  answer text not null,
  position int not null default 0,
  active boolean not null default true
);

create index faqs_scope_idx on public.faqs (scope);

-- modelo-datos.md §4.6 solo declara 'privacidad' y 'terminos'. requerimientos.md
-- §6 también pide publicar una política de devoluciones antes de producción;
-- se deja como ambigüedad para BSA/Arquitecto en vez de resolverla aquí
-- (ver nota del Coder en estado.md) — el CHECK sigue el modelo-datos exacto.
create table public.legal_pages (
  slug text primary key check (slug in ('privacidad', 'terminos')),
  title text not null,
  body text not null,
  updated_at timestamptz not null default now()
);

create trigger legal_pages_set_updated_at
  before update on public.legal_pages
  for each row execute function public.set_updated_at();
