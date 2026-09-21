-- Corrección de una laguna de 0016: `admin_change_log` se creó sin el
-- grant de tabla a `service_role` que sí tienen `products`/`returns` y
-- el resto de tablas escritas desde funciones `service_role`-only. No
-- rompía nada porque hasta ahora solo se insertaba desde dentro de esas
-- funciones (como definer, sin pasar por el grant) — pero la lectura de
-- "última modificación" de esta pantalla (H4.3) sí necesita que
-- `service_role` pueda leerla directo, igual que cualquier otra tabla.
grant select, insert, update, delete on public.admin_change_log to service_role;

-- H4: Configuración del sistema. `settings` (0002/0010) ya existe con
-- las llaves que este incremento edita (bank_name, beneficiary, clabe,
-- account_number, admin_email, admin_whatsapp, return_window_days,
-- order_auto_cancel_days) — aquí solo se agrega la función que las
-- actualiza con bitácora, reutilizando `admin_change_log` (0016, H4.3:
-- "mismo criterio que F1.5") sin crear una tabla nueva.

-- ────────────────────────────────────────────────────────────────────────
-- actualizar_configuracion: una llave a la vez (cada sección del panel
-- guarda sus propias llaves por separado — diseño.md §11.13: "un error
-- en los plazos no impide guardar lo bancario"). Solo registra bitácora
-- si el valor en verdad cambió.
-- ────────────────────────────────────────────────────────────────────────
create function public.actualizar_configuracion(
  p_key text,
  p_value text,
  p_changed_by uuid
)
returns public.settings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_anterior text;
  v_resultado public.settings;
begin
  select value into v_anterior from public.settings where key = p_key for update;
  if not found then
    raise exception 'La llave de configuración «%» no existe', p_key using errcode = 'P0002';
  end if;

  update public.settings set value = p_value, updated_at = now(), updated_by = p_changed_by
  where key = p_key
  returning * into v_resultado;

  if v_anterior is distinct from p_value then
    insert into public.admin_change_log (entity_type, entity_id, field, old_value, new_value, changed_by)
    values ('setting', p_key, p_key, v_anterior, p_value, p_changed_by);
  end if;

  return v_resultado;
end;
$$;

revoke execute on function public.actualizar_configuracion from public, anon, authenticated;
grant execute on function public.actualizar_configuracion to service_role;
