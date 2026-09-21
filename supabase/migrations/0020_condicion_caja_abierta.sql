-- Agrega 'caja_abierta' como tercera condición de producto (D6). El
-- comentario original de `products.condition` (0003) ya hablaba de
-- "usado/abierto" como la misma idea de "ficha aparte, pieza única" — esto
-- solo completa el enum que faltaba. Redefinición del CHECK: Postgres no
-- tiene "alter check", se elimina y se vuelve a crear.

alter table public.products drop constraint products_condition_check;
alter table public.products add constraint products_condition_check
  check (condition in ('nuevo', 'usado', 'caja_abierta'));

alter table public.products drop constraint products_condition_detail_check;
alter table public.products add constraint products_condition_detail_check
  check (
    (condition = 'nuevo' and condition_detail is null)
    or (condition in ('usado', 'caja_abierta'))
  );
