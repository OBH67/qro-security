-- 0009_catalogo_lectura_publica.sql
-- Adición del incremento "catálogo público" (Épica A de requerimientos.md).
-- No modifica el esquema aprobado en modelo-datos.md: agrega solo objetos de
-- SOLO LECTURA para servir el catálogo sin duplicar reglas de negocio en la
-- aplicación. Documentado también en `.devsquad/estado.md` para que el
-- Arquitecto lo revise.
--
-- Por qué hace falta:
-- 1. `catalogo_productos`: modelo-datos.md §1 define "stock disponible" como
--    "stock − piezas apartadas... calculado, no almacenado". Esta vista lo
--    calcula al vuelo (no es una columna física) para poder filtrar
--    "solo con existencia" (criterio A4) directamente en la base de datos —
--    PostgREST no permite comparar dos columnas dentro de un filtro REST
--    simple, así que sin esta vista habría que traer más filas de las
--    necesarias y paginar en el cliente, lo que el criterio A1.5 prohíbe
--    explícitamente.
-- 2. `buscar_productos()`: la búsqueda debe ser tolerante a acentos y
--    mayúsculas (criterio A2.2) sobre nombre, SKU y marca. Ese tipo de
--    condición (función `immutable_unaccent` sobre una columna de otra
--    tabla) tampoco es expresable como filtro REST; se resuelve con una
--    función SQL invocada por RPC, que además regresa el total de
--    resultados en la misma consulta para paginar sin una segunda ida y
--    vuelta a la base de datos.
--
-- Ambas corren con privilegios de "invoker" (no "definer"): un visitante
-- anónimo solo ve lo que sus políticas de RLS ya le permiten ver en
-- `products`/`brands` — ninguna de las dos otorga acceso adicional.

create view public.catalogo_productos
with (security_invoker = true)
as
select
  p.id,
  p.sku,
  p.slug,
  p.name,
  p.description,
  p.brand_id,
  p.group_id,
  p.subcategory_id,
  p.price,
  p.tax_rate,
  p.stock,
  p.reserved,
  greatest(p.stock - p.reserved, 0) as disponible,
  p.warranty_months,
  p.weight_kg,
  p.includes,
  p.attributes,
  p.status,
  p.condition,
  p.condition_detail,
  p.sales_count,
  p.created_at,
  p.updated_at
from public.products p
where p.status = 'activo';

comment on view public.catalogo_productos is
  'Solo lectura pública del catálogo activo, con "disponible" calculado '
  '(stock - reserved) para poder filtrar/ordenar por existencia real sin '
  'sobreexponer productos inactivos. Ver modelo-datos.md §1 y arquitectura.md §9.1.';

grant select on public.catalogo_productos to anon, authenticated;

-- Búsqueda tolerante a acentos/mayúsculas sobre nombre, SKU y marca
-- (criterios A2.1-A2.2), usando el índice trigram de 0003_catalogo.sql.
-- Regresa el total de coincidencias en `total_count` (ventana `count(*)
-- over()`) para paginar sin una consulta aparte (criterio A2.3: <1s).
create function public.buscar_productos(
  p_query text,
  p_limit int default 24,
  p_offset int default 0
)
returns table (
  id uuid,
  sku text,
  slug text,
  name text,
  brand_id uuid,
  group_id uuid,
  subcategory_id uuid,
  price numeric,
  stock int,
  reserved int,
  disponible int,
  sales_count int,
  condition text,
  condition_detail text,
  total_count bigint
)
language sql
stable
as $$
  with termino as (
    select public.immutable_unaccent(lower(trim(p_query))) as t
  )
  select
    p.id, p.sku, p.slug, p.name, p.brand_id, p.group_id, p.subcategory_id,
    p.price, p.stock, p.reserved, greatest(p.stock - p.reserved, 0) as disponible,
    p.sales_count, p.condition, p.condition_detail,
    count(*) over() as total_count
  from public.products p
  left join public.brands b on b.id = p.brand_id
  cross join termino
  where p.status = 'activo'
    and length(termino.t) > 0
    and (
      public.immutable_unaccent(lower(p.name)) ilike '%' || termino.t || '%'
      or public.immutable_unaccent(lower(p.sku)) ilike '%' || termino.t || '%'
      or (b.name is not null and public.immutable_unaccent(lower(b.name)) ilike '%' || termino.t || '%')
    )
  order by p.sales_count desc, p.name asc
  limit greatest(p_limit, 0)
  offset greatest(p_offset, 0);
$$;

comment on function public.buscar_productos(text, int, int) is
  'Búsqueda pública tolerante a acentos/mayúsculas por nombre, SKU y marca '
  '(criterio A2). Corre con privilegios de invoker: no otorga acceso más '
  'allá de lo que RLS ya permite a quien la invoca.';

grant execute on function public.buscar_productos(text, int, int) to anon, authenticated;
