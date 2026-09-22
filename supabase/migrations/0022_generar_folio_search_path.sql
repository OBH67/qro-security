-- 0022_generar_folio_search_path.sql
--
-- Corrige "function gen_random_bytes(integer) does not exist" al generar
-- un pedido — 0008_funciones_transaccionales.sql declaró generar_folio()
-- con `set search_path = public` (correcto, evita el hijacking de
-- search_path de una SECURITY DEFINER), y 0001_extensiones.sql instaló
-- pgcrypto con `with schema public` — pero en un proyecto de Supabase
-- ALOJADO, pgcrypto ya viene preinstalado por la plataforma en el schema
-- `extensions`, no en `public`; el `create extension if not exists` de
-- 0001 entonces no hace nada (ya existe) y `gen_random_bytes()` se queda
-- viviendo en `extensions`, fuera del search_path de la función. En
-- Supabase local (`supabase start`) sí puede quedar en `public`, así que
-- el bug no se veía siempre — solo contra un proyecto alojado real.
--
-- Arreglo: agregar `extensions` al search_path de la función en vez de
-- tocar dónde vive la extensión (evita tener que mover pgcrypto en
-- cualquier entorno que ya la tenga en un lado u otro). No hace falta
-- reescribir el cuerpo de la función completa — `alter function ... set
-- search_path` solo cambia esa configuración.

alter function public.generar_folio(text, int)
  set search_path = public, extensions;
