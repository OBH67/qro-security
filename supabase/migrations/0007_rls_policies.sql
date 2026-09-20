-- 0007_rls_policies.sql
-- Row Level Security en TODAS las tablas, con las políticas de
-- `.devsquad/modelo-datos.md` §5. Ver también `.devsquad/arquitectura.md`
-- §6.3 y §6.4.
--
-- Filosofía: RLS es la red de seguridad contra un cliente curioso con la
-- consola del navegador abierta. NO protege las operaciones hechas con
-- `service_role` (las salta por diseño) — esas dependen de que
-- `src/server/actions/_guard.ts` verifique autenticación y rol antes de
-- usar el cliente admin. Por eso aquí, sin política = acceso denegado por
-- default para `anon`/`authenticated`; nunca se asume "ya lo filtró la UI".

-- ────────────────────────────────────────────────────────────────────────
-- Helpers de rol
-- ────────────────────────────────────────────────────────────────────────

-- Lee el rol del custom claim inyectado en el JWT por el Auth Hook
-- `custom_access_token_hook` (definido abajo). Con fallback a una consulta
-- a `profiles` (SECURITY DEFINER, evita recursión de RLS) para sesiones
-- emitidas antes de habilitar el hook, o mientras no está habilitado en el
-- proyecto de Supabase (paso manual, ver nota al final de este archivo).
create function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::public.user_role,
    (select role from public.profiles where id = auth.uid()),
    'cliente'::public.user_role
  );
$$;

create function public.is_admin()
returns boolean language sql stable as $$ select public.current_role() = 'admin' $$;

create function public.is_inventario()
returns boolean language sql stable as $$ select public.current_role() = 'inventario' $$;

-- admin + inventario: los dos roles que administran catálogo (modelo-datos §5).
create function public.is_staff_catalogo()
returns boolean language sql stable as $$ select public.current_role() in ('admin', 'inventario') $$;

-- Auth Hook: inyecta profiles.role como custom claim en app_metadata del
-- JWT (arquitectura.md §6.4), para que las políticas de abajo no hagan un
-- SELECT extra por fila evaluada.
--
-- ⚠ Paso manual pendiente, fuera del alcance de una migración SQL: hay que
-- habilitar esta función como "Custom Access Token" Auth Hook en
-- Authentication → Hooks del proyecto de Supabase (aún no existe el
-- proyecto real; se hace al crearlo). Sin ese paso, `current_role()` sigue
-- funcionando correctamente vía el fallback a `profiles`, solo que con una
-- consulta adicional por verificación de rol.
create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  claims jsonb;
  user_role public.user_role;
begin
  select role into user_role from public.profiles where id = (event ->> 'user_id')::uuid;
  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(
    claims,
    '{app_metadata,role}',
    to_jsonb(coalesce(user_role, 'cliente'::public.user_role)::text)
  );
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;

-- ────────────────────────────────────────────────────────────────────────
-- Catálogo: products, groups, subcategories, brands, imágenes, documentos,
-- category_attributes, import_jobs — lectura de activos para todos;
-- lectura y escritura total para admin/inventario (modelo-datos §5).
-- ────────────────────────────────────────────────────────────────────────

alter table public.groups enable row level security;
create policy groups_select_active on public.groups
  for select to anon, authenticated using (active = true or public.is_staff_catalogo());
create policy groups_staff_write on public.groups
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

alter table public.subcategories enable row level security;
create policy subcategories_select_active on public.subcategories
  for select to anon, authenticated using (active = true or public.is_staff_catalogo());
create policy subcategories_staff_write on public.subcategories
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

alter table public.brands enable row level security;
create policy brands_select_active on public.brands
  for select to anon, authenticated using (active = true or public.is_staff_catalogo());
create policy brands_staff_write on public.brands
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

alter table public.products enable row level security;
create policy products_select_active on public.products
  for select to anon, authenticated using (status = 'activo' or public.is_staff_catalogo());
create policy products_staff_write on public.products
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

alter table public.product_images enable row level security;
create policy product_images_select on public.product_images
  for select to anon, authenticated using (true);
create policy product_images_staff_write on public.product_images
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

alter table public.product_documents enable row level security;
create policy product_documents_select on public.product_documents
  for select to anon, authenticated using (true);
create policy product_documents_staff_write on public.product_documents
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

alter table public.category_attributes enable row level security;
create policy category_attributes_select on public.category_attributes
  for select to anon, authenticated using (true);
create policy category_attributes_staff_write on public.category_attributes
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

-- import_jobs es parte del alcance de F2 (carga masiva), dentro del menú de
-- Catálogo que sí ve el rol inventario (requerimientos.md H5).
alter table public.import_jobs enable row level security;
create policy import_jobs_staff_all on public.import_jobs
  for all to authenticated using (public.is_staff_catalogo()) with check (public.is_staff_catalogo());

-- ────────────────────────────────────────────────────────────────────────
-- Identidad: profiles, addresses, billing_profiles — solo lo propio para
-- el cliente; sin acceso para inventario; total para admin.
-- ────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());
-- Nunca se crea/borra una fila de profiles desde el cliente: la crea el
-- trigger on_auth_user_created (0002) y solo admin la borra vía service_role.

alter table public.addresses enable row level security;
create policy addresses_own on public.addresses
  for all to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

alter table public.billing_profiles enable row level security;
create policy billing_profiles_own on public.billing_profiles
  for all to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- ────────────────────────────────────────────────────────────────────────
-- Carrito (adición de arquitectura, mismo patrón que addresses): solo lo
-- propio para el cliente con sesión.
-- ────────────────────────────────────────────────────────────────────────

alter table public.carts enable row level security;
create policy carts_own on public.carts
  for all to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

alter table public.cart_items enable row level security;
create policy cart_items_own on public.cart_items
  for all to authenticated using (
    public.is_admin()
    or exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  )
  with check (
    public.is_admin()
    or exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────
-- Pedidos: orders, order_items, payment_proofs — el cliente ve solo lo
-- propio, puede crear el pedido y subir su comprobante; sin acceso para
-- inventario; total para admin. Los cambios de estado, la baja de stock y
-- los movimientos de saldo NUNCA se escriben desde el navegador (§6.3):
-- por eso no hay política de UPDATE para el cliente en `orders`.
-- ────────────────────────────────────────────────────────────────────────

alter table public.orders enable row level security;
create policy orders_select_own on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy orders_insert_own on public.orders
  for insert to authenticated with check (user_id = auth.uid());
create policy orders_admin_write on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.order_items enable row level security;
create policy order_items_select_own on public.order_items
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy order_items_insert_own on public.order_items
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

alter table public.payment_proofs enable row level security;
create policy payment_proofs_select_own on public.payment_proofs
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy payment_proofs_insert_own on public.payment_proofs
  for insert to authenticated with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy payment_proofs_admin_review on public.payment_proofs
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- order_status_history y payment_confirmation_tokens: sin acceso para el
-- cliente ni para inventario; admin solo lectura. La escritura es
-- exclusiva del servidor con service_role (arquitectura §6.1: cambios de
-- estado y bitácoras inmutables), que salta RLS por diseño.
alter table public.order_status_history enable row level security;
create policy order_status_history_admin_read on public.order_status_history
  for select to authenticated using (public.is_admin());

alter table public.payment_confirmation_tokens enable row level security;
create policy payment_confirmation_tokens_admin_read on public.payment_confirmation_tokens
  for select to authenticated using (public.is_admin());

-- notification_outbox: infraestructura interna del patrón outbox (§7.3).
-- Ningún rol de cliente la toca; admin puede leerla para depurar.
alter table public.notification_outbox enable row level security;
create policy notification_outbox_admin_read on public.notification_outbox
  for select to authenticated using (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────
-- Saldo y devoluciones: credit_movements (solo lectura de lo propio, toda
-- escritura vía service_role — es una bitácora inmutable), returns /
-- return_items / return_photos (crear y leer lo propio).
-- ────────────────────────────────────────────────────────────────────────

alter table public.credit_movements enable row level security;
create policy credit_movements_select_own on public.credit_movements
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

alter table public.returns enable row level security;
create policy returns_select_own on public.returns
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy returns_insert_own on public.returns
  for insert to authenticated with check (user_id = auth.uid());
create policy returns_admin_review on public.returns
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.return_items enable row level security;
create policy return_items_select_own on public.return_items
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid())
  );
create policy return_items_insert_own on public.return_items
  for insert to authenticated with check (
    exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid())
  );

alter table public.return_photos enable row level security;
create policy return_photos_select_own on public.return_photos
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid())
  );
create policy return_photos_insert_own on public.return_photos
  for insert to authenticated with check (
    exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────
-- Servicios: service_requests — crear incluso sin cuenta (visitante);
-- sin acceso de lectura para el cliente/visitante ni para inventario;
-- total para admin.
-- ────────────────────────────────────────────────────────────────────────

alter table public.service_requests enable row level security;
create policy service_requests_insert_public on public.service_requests
  for insert to anon, authenticated with check (true);
create policy service_requests_admin_all on public.service_requests
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ────────────────────────────────────────────────────────────────────────
-- Configuración y contenido: settings, banners, faqs, legal_pages —
-- lectura pública; sin acceso para inventario; total para admin.
-- ────────────────────────────────────────────────────────────────────────

alter table public.settings enable row level security;
create policy settings_select_public on public.settings
  for select to anon, authenticated using (true);
create policy settings_admin_write on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.banners enable row level security;
create policy banners_select_public on public.banners
  for select to anon, authenticated using (active = true or public.is_admin());
create policy banners_admin_write on public.banners
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.reviews enable row level security;
create policy reviews_select_published on public.reviews
  for select to anon, authenticated using (published = true or public.is_admin());
create policy reviews_admin_write on public.reviews
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.faqs enable row level security;
create policy faqs_select_active on public.faqs
  for select to anon, authenticated using (active = true or public.is_admin());
create policy faqs_admin_write on public.faqs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.legal_pages enable row level security;
create policy legal_pages_select_public on public.legal_pages
  for select to anon, authenticated using (true);
create policy legal_pages_admin_write on public.legal_pages
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
