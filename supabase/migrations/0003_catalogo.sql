-- 0003_catalogo.sql
-- Catálogo: grupos, árbol de subcategorías (D7), marcas, productos (D1, D4,
-- D5, D6) y sus imágenes/documentos/atributos filtrables.
-- Ver `.devsquad/modelo-datos.md` §3 y §4.2.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  position int not null default 0,
  active boolean not null default true
);

-- Subcategorías en árbol auto-referenciado (D7): un grupo puede tener
-- subcategorías de un solo nivel o de varios (ej. Cableado Estructurado),
-- sin cambiar el esquema. parent_id nulo = primer nivel.
create table public.subcategories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  parent_id uuid references public.subcategories (id) on delete cascade,
  slug text not null,
  name text not null,
  position int not null default 0,
  active boolean not null default true,
  -- Un parent_id, si existe, debe pertenecer al mismo grupo raíz. Se valida
  -- en la aplicación (server/domain) porque una FK compuesta aquí no puede
  -- expresar "mismo group_id que su padre" sin duplicar la columna.
  unique (group_id, parent_id, slug)
);

create index subcategories_group_id_idx on public.subcategories (group_id);
create index subcategories_parent_id_idx on public.subcategories (parent_id);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  active boolean not null default true
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name text not null,
  description text,
  brand_id uuid references public.brands (id),
  group_id uuid not null references public.groups (id),
  subcategory_id uuid not null references public.subcategories (id),
  price numeric(12, 2) not null check (price >= 0), -- con IVA incluido (RN-2)
  tax_rate numeric(4, 3) not null default 0.160,
  stock int not null default 0 check (stock >= 0),
  -- Piezas apartadas por pedidos en comprobante_recibido/listo_envio
  -- (arquitectura.md §9.1, adición de arquitectura sobre el modelo de
  -- datos). Es la garantía de "cero sobreventas" a nivel de base de datos:
  -- solo la tocan las funciones de 0008_funciones_transaccionales.sql.
  reserved int not null default 0,
  warranty_months int not null default 12,
  weight_kg numeric(8, 3),
  includes text[],
  attributes jsonb not null default '{}'::jsonb,
  status text not null default 'activo'
    check (status in ('activo', 'agotado', 'descontinuado')),
  -- D6: un producto devuelto usado/abierto es una ficha nueva, no un ajuste
  -- de stock del original.
  condition text not null default 'nuevo' check (condition in ('nuevo', 'usado')),
  condition_detail text,
  -- FK a returns se agrega en 0005_devoluciones_y_saldo.sql (returns se
  -- crea después; products se crea primero porque returns también apunta
  -- a productos vendidos a través de order_items).
  source_return_id uuid,
  sales_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_reserved_valid check (reserved >= 0 and reserved <= stock),
  constraint products_condition_detail_check check (
    (condition = 'nuevo' and condition_detail is null)
    or (condition = 'usado')
  )
);

create index products_group_subcategory_idx on public.products (group_id, subcategory_id);
create index products_attributes_gin_idx on public.products using gin (attributes);
create index products_status_idx on public.products (status);
create index products_sales_count_idx on public.products (sales_count desc);

-- `unaccent()` es STABLE, no IMMUTABLE, y Postgres exige IMMUTABLE para
-- indexar una expresión. Este envoltorio fija el diccionario y lo declara
-- IMMUTABLE (patrón estándar de Postgres para este caso).
create function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, pg_catalog
as $$
  select public.unaccent('public.unaccent'::regdictionary, $1);
$$;

-- Búsqueda tolerante a acentos/mayúsculas y a errores de dedo sobre
-- nombre + SKU (criterios A2.1-A2.3, arquitectura §9.4).
create index products_search_trgm_idx on public.products
  using gin (public.immutable_unaccent(coalesce(name, '') || ' ' || coalesce(sku, '')) gin_trgm_ops);

-- Utilidad compartida: mantiene `updated_at` al día en cualquier tabla que
-- la tenga. Se define una sola vez aquí y se reutiliza en migraciones
-- posteriores (ej. legal_pages en 0006).
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null, -- clave del objeto en R2, nunca una URL firmada
  alt text,
  position int not null default 0
);

create index product_images_product_id_idx on public.product_images (product_id);

create table public.product_documents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  kind text not null check (kind in ('ficha_tecnica', 'manual', 'otro')),
  name text not null,
  url text not null,
  size_bytes bigint
);

create index product_documents_product_id_idx on public.product_documents (product_id);

-- Define qué atributos son válidos y filtrables por categoría (D1).
create table public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id),
  subcategory_id uuid references public.subcategories (id),
  key text not null,
  label text not null,
  data_type text not null check (data_type in ('text', 'number', 'boolean')),
  options text[],
  filterable boolean not null default true,
  position int not null default 0
);

create index category_attributes_group_id_idx on public.category_attributes (group_id);
create index category_attributes_subcategory_id_idx on public.category_attributes (subcategory_id);

-- ── Adición de arquitectura (arquitectura.md §5, F2/carga masiva) ─────────
-- import_jobs: estado de la carga masiva del catálogo por lotes, con vista
-- previa y reporte de errores por fila (§9.5, criterios F2.2/F2.4).
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  file_url text not null, -- clave del CSV/Excel subido a R2
  mode text not null check (mode in ('crear_actualizar', 'solo_precio', 'solo_stock')),
  status text not null default 'analizando'
    check (status in ('analizando', 'listo_para_aplicar', 'aplicando', 'completado', 'error')),
  total_rows int,
  valid_rows int,
  error_rows int,
  processed_rows int not null default 0,
  errors_report jsonb, -- [{fila, motivo}], para el CSV de filas rechazadas
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index import_jobs_status_idx on public.import_jobs (status);
