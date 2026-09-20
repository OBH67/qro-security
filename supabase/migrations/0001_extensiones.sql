-- 0001_extensiones.sql
-- Extensiones de Postgres que el resto del esquema necesita.
-- Ver `.devsquad/arquitectura.md` §4 (orden de migraciones) y §9.4 (búsqueda).

-- unaccent + pg_trgm: búsqueda tolerante a acentos, mayúsculas y errores de
-- dedo sobre nombre/SKU/marca (criterios A2.1-A2.3), sin motor externo.
create extension if not exists pg_trgm with schema public;
create extension if not exists unaccent with schema public;

-- pgcrypto: gen_random_bytes / gen_random_uuid para folios no adivinables
-- (arquitectura.md §9.2) y tokens de confirmación de pago (§9.3).
create extension if not exists pgcrypto with schema public;
