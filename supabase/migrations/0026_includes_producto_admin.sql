-- 0026_includes_producto_admin.sql
-- Pestaña "Qué incluye" de la ficha pública de producto (PestanasProducto.tsx)
-- lee `products.includes` (text[], ya existe desde 0003_catalogo.sql) pero
-- nunca hubo forma de capturarlo desde el panel — ni `crear_producto()` ni
-- `actualizar_producto()` lo aceptaban. Reportado por la dueña: la pestaña
-- siempre decía "El administrador todavía no capturó qué incluye este
-- producto." sin ningún campo en el editor para arreglarlo.
--
-- Mismo criterio que `p_attributes` en 0025: se elimina y recrea cada
-- función (agregar un parámetro cambia su firma/identidad en Postgres, un
-- `create or replace` con distinta firma crearía una segunda función
-- sobrepuesta en vez de reemplazar la original).
drop function if exists public.crear_producto(
  text, text, numeric, uuid, uuid, uuid, text, int, text, text, text, uuid
);

create function public.crear_producto(
  p_sku text,
  p_name text,
  p_price numeric,
  p_group_id uuid,
  p_subcategory_id uuid,
  p_brand_id uuid default null,
  p_description text default null,
  p_stock int default 0,
  p_status text default 'activo',
  p_condition text default 'nuevo',
  p_condition_detail text default null,
  p_source_return_id uuid default null,
  p_includes text[] default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products;
  v_slug_base text;
  v_slug text;
  v_intentos int := 0;
begin
  if exists (select 1 from public.products where sku = p_sku) then
    raise exception 'Ya existe un producto con el SKU %', p_sku using errcode = '23505';
  end if;

  v_slug_base := trim(both '-' from regexp_replace(lower(public.immutable_unaccent(p_name)), '[^a-z0-9]+', '-', 'g'));
  v_slug := v_slug_base;

  loop
    v_intentos := v_intentos + 1;
    begin
      insert into public.products (
        sku, slug, name, description, brand_id, group_id, subcategory_id,
        price, stock, status, condition, condition_detail, source_return_id, includes
      ) values (
        p_sku, v_slug, p_name, p_description, p_brand_id, p_group_id, p_subcategory_id,
        p_price, p_stock, p_status, p_condition, p_condition_detail, p_source_return_id, p_includes
      )
      returning * into v_product;
      exit;
    exception
      when unique_violation then
        if v_intentos >= 8 then
          raise exception 'No se pudo generar una dirección web única para "%s"', p_name using errcode = '40001';
        end if;
        v_slug := v_slug_base || '-' || v_intentos;
    end;
  end loop;

  return v_product;
end;
$$;

drop function if exists public.actualizar_producto(
  uuid, uuid, text, text, uuid, uuid, uuid, numeric, int, text, text, text, jsonb
);

create function public.actualizar_producto(
  p_product_id uuid,
  p_changed_by uuid,
  p_name text default null,
  p_description text default null,
  p_brand_id uuid default null,
  p_group_id uuid default null,
  p_subcategory_id uuid default null,
  p_price numeric default null,
  p_stock int default null,
  p_status text default null,
  p_condition text default null,
  p_condition_detail text default null,
  p_attributes jsonb default null,
  p_includes text[] default null
)
returns public.products
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.products;
  v_after public.products;
  v_condition_resultante text;
begin
  select * into v_before from public.products where id = p_product_id for update;
  if v_before.id is null then
    raise exception 'El producto no existe' using errcode = 'P0002';
  end if;

  v_condition_resultante := coalesce(p_condition, v_before.condition);

  update public.products set
    name = coalesce(p_name, name),
    description = coalesce(p_description, description),
    brand_id = coalesce(p_brand_id, brand_id),
    group_id = coalesce(p_group_id, group_id),
    subcategory_id = coalesce(p_subcategory_id, subcategory_id),
    price = coalesce(p_price, price),
    stock = coalesce(p_stock, stock),
    status = coalesce(p_status, status),
    condition = v_condition_resultante,
    condition_detail = case when v_condition_resultante = 'nuevo' then null else coalesce(p_condition_detail, condition_detail) end,
    attributes = coalesce(p_attributes, attributes),
    includes = coalesce(p_includes, includes),
    updated_at = now()
  where id = p_product_id
  returning * into v_after;

  if p_price is not null and p_price <> v_before.price then
    insert into public.admin_change_log (entity_type, entity_id, field, old_value, new_value, changed_by)
    values ('product', p_product_id::text, 'price', v_before.price::text, v_after.price::text, p_changed_by);
  end if;
  if p_stock is not null and p_stock <> v_before.stock then
    insert into public.admin_change_log (entity_type, entity_id, field, old_value, new_value, changed_by)
    values ('product', p_product_id::text, 'stock', v_before.stock::text, v_after.stock::text, p_changed_by);
  end if;
  if p_status is not null and p_status <> v_before.status then
    insert into public.admin_change_log (entity_type, entity_id, field, old_value, new_value, changed_by)
    values ('product', p_product_id::text, 'status', v_before.status, v_after.status, p_changed_by);
  end if;

  return v_after;
end;
$$;

revoke execute on function public.crear_producto from public, anon, authenticated;
revoke execute on function public.actualizar_producto from public, anon, authenticated;
grant execute on function public.crear_producto to service_role;
grant execute on function public.actualizar_producto to service_role;
