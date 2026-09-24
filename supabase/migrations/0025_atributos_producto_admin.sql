-- 0025_atributos_producto_admin.sql
-- F1.4/diseño.md §11.7 — pestaña "Especificaciones" del editor de
-- producto. `products.attributes` (jsonb) ya existía desde
-- 0003_catalogo.sql, pero `actualizar_producto()` (0016_catalogo_admin.sql)
-- nunca aceptaba tocarla — se agrega `p_attributes` al final, con el
-- mismo criterio que el resto de sus parámetros: default null = "no
-- cambiar este campo". El panel siempre manda el objeto completo (todas
-- las claves de `category_attributes` para el grupo/subcategoría del
-- producto), así que "no null" siempre reemplaza el jsonb entero, nunca
-- lo mezcla — no hace falta jsonb_merge aquí.
--
-- Se elimina la función vieja explícitamente (por su firma exacta) antes
-- de crear la nueva: agregar un parámetro cambia la lista de tipos de
-- entrada, que en Postgres SÍ es parte de la identidad de la función —
-- un `create or replace` con una firma distinta crea una SEGUNDA función
-- sobrecargada en vez de reemplazar la original, dejando ambas activas.
drop function if exists public.actualizar_producto(
  uuid, uuid, text, text, uuid, uuid, uuid, numeric, int, text, text, text
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
  p_attributes jsonb default null
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

revoke execute on function public.actualizar_producto from public, anon, authenticated;
grant execute on function public.actualizar_producto to service_role;
