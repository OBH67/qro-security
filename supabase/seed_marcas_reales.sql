-- seed_marcas_reales.sql — aplicar sobre tu base YA sembrada (hosted),
-- sin resetear nada. Trae las 30 marcas reales que compartiste (PA-13,
-- cerrada 2026-09-22) y apaga las 6 de relleno para que no se mezclen en
-- la franja "Marcas que distribuimos" de la portada.
--
-- A diferencia de los scripts de bulk anteriores, este SÍ es seguro
-- correrlo más de una vez: usa "on conflict (slug) do update", así que
-- si se cortó a medias la vez pasada, con volver a correrlo completo
-- se corrige solo (no inserta duplicados ni truena por SKU repetido).
--
-- Este mismo contenido ya vive también en `supabase/seed.sql` (para
-- cuando alguien reinicie la base desde cero) — este archivo aparte es
-- solo para aplicarlo hoy, en la base que ya tienes cargada.

begin;

-- Apaga las marcas de relleno de `seed_dev.sql` (si existen en esta base)
-- para que no aparezcan junto a las reales. No se borran: los productos
-- de muestra todavía las usan como `brand_id`.
update public.brands set active = false
where slug in ('nortvision', 'axelock', 'perimetra', 'voltara', 'fibranet', 'rutaviva');

insert into public.brands (name, slug, logo_url, active) values
  ('RUIJIE', 'ruijie', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_ruijie.png', true),
  ('FAAC', 'faac', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_faac.png', true),
  ('CYBERPOWER', 'cyberpower', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_cyberpower.png', true),
  ('GROWATT', 'growatt', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_growatt.png', true),
  ('ECOFLOW', 'ecoflow', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_ecoflow.png', true),
  ('HOYMILES', 'hoymiles', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/fotos/logotipos/hoymiles.png', true),
  ('ALLIED TELESIS', 'allied-telesis', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_allied.png', true),
  ('ALTAI TECHNOLOGIES', 'altai-technologies', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_altai.png', true),
  ('CAMBIUM NETWORKS', 'cambium-networks', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_cambium.png', true),
  ('CAME', 'came', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_came.png', true),
  ('HUAWEI', 'huawei', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_huawei.png', true),
  ('FANVIL', 'fanvil', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_fanvil.png', true),
  ('FIBERHOME', 'fiberhome', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_fiberhome.png', true),
  ('GRANDSTREAM', 'grandstream', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_grandstream.png', true),
  ('DJI', 'dji', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_dji.png', true),
  ('HID', 'hid', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_hid.png', true),
  ('HIKVISION', 'hikvision', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_hikvision.png', true),
  ('IDEMIA', 'idemia', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_idemia.png', true),
  ('KENWOOD', 'kenwood', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_kenwood.png', true),
  ('LUTRON', 'lutron', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_lutron.png', true),
  ('SIMON', 'simon', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_simon.png', true),
  ('PANDUIT', 'panduit', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_panduit.png', true),
  ('PLANET', 'planet', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_planet.png', true),
  ('HONEYWELL / RESIDEO', 'honeywell-resideo', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_resideo.png', true),
  ('SYNOLOGY', 'synology', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/fotos/logotipos/synology.png', true),
  ('SUPREMA', 'suprema', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_suprema.png', true),
  ('TP-LINK', 'tp-link', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_tplink.png', true),
  ('UBIQUITI', 'ubiquiti', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_ubiquiti.png', true),
  ('LINKEDPRO', 'linkedpro', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_linkedpro.png', true),
  ('AUFIT', 'aufit', 'https://ftp3.syscom.mx/cdn-cgi/image/format=webp,width=240,height=120/usuarios/ftp/single_page/topbrands/log2_aufit.png', true)
on conflict (slug) do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  active = true;

commit;
