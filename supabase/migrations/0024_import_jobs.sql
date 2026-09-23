-- 0024_import_jobs.sql
-- F2.3/F2.4 — paso 3 del importador de catálogo ("Aplicar"), arquitectura.md
-- §9.5: procesar hasta 1,050 filas en una sola petición choca contra el
-- tiempo máximo de una función serverless, y un fallo a la mitad deja el
-- catálogo en un estado indeterminado. Se guarda el trabajo en esta tabla
-- y se aplica por lotes (200 filas, `aplicarLoteImportacionAction`), cada
-- lote en su propia llamada — así una fila mala no detiene a las demás
-- (F2.4) y el progreso sobrevive a un refresh o a cerrar la pestaña sin
-- terminar (se reanuda leyendo `siguiente_indice`).
--
-- Simplificación real frente a §9.5/diseño.md §11.8, documentada aquí en
-- vez de omitida en silencio: el avance de lote a lote lo dispara el
-- navegador de quien importa (un `fetch` tras otro mientras la pestaña
-- sigue abierta), no un cron en el servidor — por eso NO hay aviso por
-- correo "te avisamos cuando termine" ni avance real con la pestaña
-- cerrada. Si se cierra a medio camino, el trabajo se queda "procesando"
-- con su progreso intacto y se reanuda (mismo botón) la próxima vez que
-- se entra al importador — solo que hay que dejar la pestaña abierta
-- mientras corre.
create table public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id),
  nombre_archivo text not null,
  modo text not null check (modo in ('todo', 'solo_precios', 'solo_stock')),
  status text not null default 'procesando' check (status in ('procesando', 'completado', 'detenido')),
  -- Solo las filas que pasaron la validación del paso 2 (F2.2) — las que
  -- tenían error nunca llegan aquí, se descartan desde el paso 2.
  filas jsonb not null,
  total int not null,
  -- Fijos desde que se crea el trabajo (lo que decidió el paso 2, F2.2) —
  -- no una cuenta en vivo de lo aplicado, para el resumen final
  -- "X aplicados · Y nuevos · Z actualizados" de diseño.md §11.8.
  nuevos int not null default 0,
  actualizados int not null default 0,
  siguiente_indice int not null default 0,
  aplicados int not null default 0,
  fallidos int not null default 0,
  -- [{numeroFila, sku, nombre, motivo}] — para el CSV de "filas que fallaron".
  fallas jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index import_jobs_created_by_idx on public.import_jobs (created_by, status);

alter table public.import_jobs enable row level security;

-- Mismo alcance que el resto del importador (F2): admin e inventario.
create policy import_jobs_staff_select on public.import_jobs
  for select to authenticated using (public.is_staff_catalogo());
