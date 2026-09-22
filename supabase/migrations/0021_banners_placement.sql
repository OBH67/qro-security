-- Corrección: `obtenerBannerDeGrupo()` (catálogo, decimoséptimo incremento)
-- reutilizaba la misma tabla `banners` sin distinguir su destino —
-- actualizar un banner de categoría terminaba cambiando también el
-- carrusel de la portada (`BannerHero`, que lee TODOS los banners
-- activos). Un banner es o de portada o de catálogo, nunca las dos cosas
-- a la vez: se necesita un destino explícito, no inferido.
alter table public.banners add column placement text not null default 'home'
  check (placement in ('home', 'catalogo'));
