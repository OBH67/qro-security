-- 0002_identidad_y_roles.sql
-- Identidad, roles y datos del cliente. Ver `.devsquad/modelo-datos.md` §4.1.

create type public.user_role as enum ('cliente', 'admin', 'inventario');

-- profiles extiende auth.users (Supabase Auth). El rol vive aquí y se
-- replica como custom claim en el JWT mediante un Auth Hook (arquitectura
-- §6.4) para que RLS lo lea sin un SELECT extra por fila evaluada.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  role public.user_role not null default 'cliente',
  email_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index profiles_email_idx on public.profiles (lower(email));
create index profiles_role_idx on public.profiles (role);

comment on table public.profiles is
  'Extiende auth.users. El rol inventario solo puede leer/escribir products, '
  'product_images, product_documents, brands, subcategories (modelo-datos.md §4.1).';

-- Crea automáticamente el perfil al registrarse (Supabase Auth solo crea la
-- fila en auth.users). first_name/last_name/phone vienen de las opciones de
-- signUp() como user_metadata, capturadas en B2.1.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Direcciones de envío (modelo-datos.md §4.1, hallazgo #9: varias por cliente)
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  street text not null,
  ext_number text not null,
  int_number text,
  postal_code text not null,
  neighborhood text not null,
  municipality text not null,
  state text not null,
  recipient_name text not null,
  directions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

-- Datos fiscales (modelo-datos.md §4.1). Solo captura: no se emite factura
-- automática (fuera de alcance, requerimientos.md B3.4).
create table public.billing_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  rfc text not null,
  legal_name text not null,
  tax_regime text not null,
  cfdi_use text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index billing_profiles_user_id_idx on public.billing_profiles (user_id);
