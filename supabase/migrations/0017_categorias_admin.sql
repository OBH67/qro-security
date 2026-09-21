-- 0017_categorias_admin.sql
-- Panel admin — Categorías (F3): crear/renombrar/reordenar grupos y
-- subcategorías, sin eliminar una con productos activos sin reasignarlos.
-- Mismo patrón `service_role`-only de las demás funciones transaccionales.

-- ────────────────────────────────────────────────────────────────────────
-- crear_grupo: alta de un grupo de primer nivel.
-- ────────────────────────────────────────────────────────────────────────
create function public.crear_grupo(p_name text, p_code text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_grupo public.groups;
  v_slug_base text;
  v_slug text;
  v_intentos int := 0;
  v_posicion int;
begin
  if exists (select 1 from public.groups where code = p_code) then
    raise exception 'Ya existe un grupo con el código %', p_code using errcode = '23505';
  end if;

  select coalesce(max(position), -1) + 1 into v_posicion from public.groups;
  v_slug_base := trim(both '-' from regexp_replace(lower(public.immutable_unaccent(p_name)), '[^a-z0-9]+', '-', 'g'));
  v_slug := v_slug_base;

  loop
    v_intentos := v_intentos + 1;
    begin
      insert into public.groups (code, slug, name, position, active)
      values (p_code, v_slug, p_name, v_posicion, true)
      returning * into v_grupo;
      exit;
    exception
      when unique_violation then
        if v_intentos >= 8 then
          raise exception 'No se pudo generar una dirección web única para "%s"', p_name using errcode = '40001';
        end if;
        v_slug := v_slug_base || '-' || v_intentos;
    end;
  end loop;

  return v_grupo;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- crear_subcategoria: alta en cualquier nivel del árbol (D7) — p_parent_id
-- nulo = primer nivel. Valida que el padre, si existe, sea del mismo
-- grupo (la FK no puede expresarlo, según ya documentaba 0003).
-- ────────────────────────────────────────────────────────────────────────
create function public.crear_subcategoria(p_group_id uuid, p_name text, p_parent_id uuid default null)
returns public.subcategories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub public.subcategories;
  v_slug_base text;
  v_slug text;
  v_intentos int := 0;
  v_posicion int;
begin
  if p_parent_id is not null and not exists (select 1 from public.subcategories where id = p_parent_id and group_id = p_group_id) then
    raise exception 'La subcategoría padre no pertenece a este grupo' using errcode = '22023';
  end if;

  select coalesce(max(position), -1) + 1 into v_posicion
  from public.subcategories
  where group_id = p_group_id and parent_id is not distinct from p_parent_id;

  v_slug_base := trim(both '-' from regexp_replace(lower(public.immutable_unaccent(p_name)), '[^a-z0-9]+', '-', 'g'));
  v_slug := v_slug_base;

  loop
    v_intentos := v_intentos + 1;
    begin
      insert into public.subcategories (group_id, parent_id, slug, name, position, active)
      values (p_group_id, p_parent_id, v_slug, p_name, v_posicion, true)
      returning * into v_sub;
      exit;
    exception
      when unique_violation then
        if v_intentos >= 8 then
          raise exception 'No se pudo generar una dirección web única para "%s"', p_name using errcode = '40001';
        end if;
        v_slug := v_slug_base || '-' || v_intentos;
    end;
  end loop;

  return v_sub;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- actualizar_categoria: renombrar/ocultar, para grupo o subcategoría
-- (p_tipo distingue la tabla). "Oculta" es active=false — misma regla que
-- products.status: nunca se borra por ocultar.
-- ────────────────────────────────────────────────────────────────────────
create function public.actualizar_categoria(p_tipo text, p_id uuid, p_name text default null, p_active boolean default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if p_tipo = 'grupo' then
    update public.groups set name = coalesce(p_name, name), active = coalesce(p_active, active) where id = p_id;
    select to_jsonb(g) into v_result from public.groups g where id = p_id;
  elsif p_tipo = 'subcategoria' then
    update public.subcategories set name = coalesce(p_name, name), active = coalesce(p_active, active) where id = p_id;
    select to_jsonb(s) into v_result from public.subcategories s where id = p_id;
  else
    raise exception 'Tipo de categoría inválido: %', p_tipo using errcode = '22023';
  end if;

  if v_result is null then
    raise exception 'La categoría no existe' using errcode = 'P0002';
  end if;

  return v_result;
end;
$$;

-- ────────────────────────────────────────────────────────────────────────
-- eliminar_subcategoria (F3): rechaza si ella o cualquier descendiente
-- tiene productos activos — "sin eliminar... sin reasignarlos" (F3).
-- Un grupo no se elimina desde el panel (siempre son los mismos 6 del
-- negocio, ver contexto-negocio.md §3) — solo se puede ocultar.
-- ────────────────────────────────────────────────────────────────────────
create function public.eliminar_subcategoria(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_productos_activos int;
begin
  with recursive descendientes as (
    select id from public.subcategories where id = p_id
    union all
    select s.id from public.subcategories s join descendientes d on s.parent_id = d.id
  )
  select count(*) into v_productos_activos
  from public.products p
  where p.subcategory_id in (select id from descendientes) and p.status = 'activo';

  if v_productos_activos > 0 then
    raise exception 'Esta subcategoría (o una de sus subcategorías) tiene % producto(s) activo(s). Reasígnalos antes de eliminarla.', v_productos_activos
      using errcode = '23503';
  end if;

  delete from public.subcategories where id = p_id;
end;
$$;

revoke execute on function public.crear_grupo from public, anon, authenticated;
revoke execute on function public.crear_subcategoria from public, anon, authenticated;
revoke execute on function public.actualizar_categoria from public, anon, authenticated;
revoke execute on function public.eliminar_subcategoria from public, anon, authenticated;
grant execute on function public.crear_grupo to service_role;
grant execute on function public.crear_subcategoria to service_role;
grant execute on function public.actualizar_categoria to service_role;
grant execute on function public.eliminar_subcategoria to service_role;
