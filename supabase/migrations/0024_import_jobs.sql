-- 0024_import_jobs.sql
-- F2.3/F2.4 — paso 3 del importador de catálogo ("Aplicar"). La tabla
-- `import_jobs` ya existía desde 0003_catalogo.sql (adición de
-- arquitectura §9.5, prevista desde el día 1 aunque nada la usaba
-- todavía) y su RLS desde 0007_rls_policies.sql — esta migración solo la
-- COMPLETA, nunca la recrea.
--
-- Dos cosas le faltaban a ese diseño original para el paso 3 de verdad:
--
-- 1. Dónde guardar las filas YA VALIDADAS (paso 2, F2.2) para aplicarlas
--    por lotes sin releer ni revalidar el archivo en cada lote — el
--    diseño original solo guardaba `file_url` (la clave del archivo en
--    R2) asumiendo que cada lote lo releería de ahí. Se simplifica aquí:
--    en vez de subir el CSV a R2 y volver a parsearlo/validarlo en cada
--    llamada de lote, las filas ya validadas (`ok: true` únicamente) se
--    guardan tal cual en la columna nueva `filas` al crear el trabajo —
--    el archivo nunca se sube a R2 en esta implementación. Por eso
--    `file_url` (que sí sigue existiendo, `not null`) guarda el NOMBRE
--    del archivo para mostrarlo en pantalla, no una clave real de R2.
-- 2. Un estado para "el usuario detuvo la importación a la mitad"
--    (diseño.md §11.8, "¿Detener la importación?") — el check original
--    de `status` no lo contemplaba.
alter table public.import_jobs
  add column filas jsonb not null default '[]'::jsonb,
  add column nuevos int not null default 0,
  add column actualizados int not null default 0;

comment on column public.import_jobs.file_url is
  'Nombre del archivo subido (no una clave de R2 — el archivo no se sube a R2 en esta implementación, ver 0024_import_jobs.sql).';
comment on column public.import_jobs.filas is
  'Filas ya validadas en el paso 2 (solo ok:true) — lo que el paso 3 va aplicando por lotes.';

alter table public.import_jobs drop constraint import_jobs_status_check;
alter table public.import_jobs add constraint import_jobs_status_check
  check (status in ('analizando', 'listo_para_aplicar', 'aplicando', 'completado', 'error', 'detenido'));
