-- seed_dev_bulk_43_productos.sql — SOLO PARA DESARROLLO LOCAL.
--
-- Script independiente y de un solo uso: agrega los 43 productos nuevos
-- (uno por cada subcategoría raíz que todavía no tenía ninguno) SIN tocar
-- nada de lo que ya tengas en tu base local — no resetea, no borra, no
-- vuelve a insertar marcas ni los 14 productos de muestra previos.
--
-- Requiere que `seed.sql` y (la versión anterior de) `seed_dev.sql` ya
-- estén aplicados en tu base — si tu base está vacía o nunca corriste
-- `seed_dev.sql`, usa ese archivo completo en vez de este.
--
-- Idempotencia: NO se puede correr dos veces (los SKU/slug son únicos,
-- la segunda corrida fallaría por duplicado). Si ya lo corriste una vez,
-- no vuelvas a correrlo — esos 43 productos ya están en tu base.
--
-- Cómo correrlo (elige uno):
--
-- Opción 1 — psql (si lo tienes instalado):
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/seed_dev_bulk_43_productos.sql
--
-- Opción 2 — Supabase Studio (sin instalar nada):
--   1. Abre http://127.0.0.1:54323 (se levanta solo con `supabase start`).
--   2. SQL Editor → New query.
--   3. Copia y pega TODO el contenido de este archivo, dale Run.
--
-- Este mismo contenido ya vive también dentro de `seed_dev.sql` completo
-- (para cuando alguien reinicie la base desde cero) — este archivo aparte
-- es solo para aplicarlo hoy sin perder lo que ya tienes cargado.

begin;

-- ── Bulk de productos (2026-09-22) — al menos 1 producto por cada
-- subcategoría RAÍZ (parent_id nulo) que todavía no tenía ninguno, para
-- que "Para Ti" (`obtenerParaTi()`, hasta 8 pestañas) tenga de dónde
-- elegir y la persona pueda navegar entre productos de categorías
-- distintas en vez de las mismas ~6 de siempre. De las 54 subcategorías
-- raíz reales (`seed.sql`), 11 ya tenían producto arriba; estas 43 son
-- las que faltaban. El grupo GPS/Telemática tiene una sola raíz y ya
-- estaba cubierta, así que no aparece aquí.
--
-- Precios, stock y atributos son de relleno razonable (no catálogo real
-- de la dueña, PA-11 sigue abierta) — el objetivo es variedad navegable,
-- no exactitud de producto. La foto de cada uno reutiliza la misma URL
-- ya asignada arriba para su GRUPO (no hay una foto real por
-- subcategoría todavía), para no introducir URLs nuevas sin verificar.

-- Videovigilancia (7)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0100', 'kit-conectores-bnc-alimentacion', 'Kit de conectores BNC y de alimentación para cámara', 'Kit de 20 piezas con conectores BNC y de alimentación DC para instalación de cámaras.', g.id, s.id, 149.00, 80, 6, jsonb_build_object('tipo', 'BNC + DC', 'piezas', '20')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cables-y-conectores' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0101', 'fuente-poder-12v-5a-cctv', 'Fuente de poder regulada 12V 5A para CCTV', 'Fuente de poder regulada de 12 V y 5 A, ideal para alimentar cámaras y accesorios de videovigilancia.', g.id, s.id, 289.00, 40, 12, jsonb_build_object('voltaje', '12 V', 'corriente', '5 A')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'energia' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0102', 'kit-videovigilancia-turbohd-8ch-4-camaras', 'Kit de videovigilancia TurboHD de 8 canales con 4 cámaras', 'Kit completo: DVR de 8 canales, 4 cámaras TurboHD de 2 MP y cableado incluido.', (select id from public.brands where slug = 'nortvision'), g.id, s.id, 6490.00, 10, 24, jsonb_build_object('canales', '8', 'camaras', '4', 'resolucion', '2 MP')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'kits-sistemas-completos' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0103', 'monitor-led-22-monitoreo', 'Monitor LED 22 pulgadas para monitoreo de video', 'Monitor LED de 22 pulgadas con entradas HDMI y VGA, pensado para estaciones de monitoreo.', g.id, s.id, 2190.00, 12, 12, jsonb_build_object('tamano', '22"', 'entradas', 'HDMI/VGA')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'monitores-pantallas-y-mobiliario' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0104', 'disco-duro-videovigilancia-4tb', 'Disco duro para videovigilancia 4 TB', 'Disco duro de 4 TB diseñado para grabación continua 24/7 en NVR/DVR.', g.id, s.id, 1890.00, 25, 24, jsonb_build_object('capacidad', '4 TB', 'uso', 'Videovigilancia 24/7')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'servidores-almacenamiento' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0105', 'licencia-vms-16-canales', 'Licencia de software VMS para 16 canales', 'Licencia perpetua de software de gestión de video (VMS) para hasta 16 canales.', g.id, s.id, 3200.00, 50, 12, jsonb_build_object('canales', '16', 'tipo', 'Perpetua')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'software-vms-y-analiticas' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0106', 'videoportero-ip-app-movil', 'Videoportero IP con app móvil', 'Videoportero IP con conectividad WiFi y notificaciones en app móvil (iOS/Android).', (select id from public.brands where slug = 'nortvision'), g.id, s.id, 2450.00, 18, 12, jsonb_build_object('conectividad', 'WiFi', 'app', 'iOS/Android')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'videoporteros-e-interfonos' and s.parent_id is null where g.slug = 'videovigilancia';

-- Control de Acceso (12)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0100', 'barrera-vehicular-brazo-3m', 'Barrera vehicular automática de brazo 3 m', 'Barrera vehicular automática con brazo de 3 metros, ciclo de trabajo intensivo.', g.id, s.id, 8900.00, 5, 12, jsonb_build_object('longitud_brazo', '3 m', 'ciclo', 'Intensivo')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'acceso-vehicular' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0101', 'contacto-magnetico-empotrable', 'Contacto magnético para puerta, empotrable', 'Contacto magnético empotrable, normalmente cerrado, para marcos de puerta y ventana.', g.id, s.id, 129.00, 60, 12, jsonb_build_object('tipo', 'Empotrable', 'normalmente', 'Cerrado')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'accesorios' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0102', 'cerradura-rfid-hotel', 'Cerradura electrónica con tarjeta RFID para hotel', 'Cerradura electrónica con lector de tarjeta RFID, pensada para uso hotelero.', (select id from public.brands where slug = 'axelock'), g.id, s.id, 1790.00, 20, 24, jsonb_build_object('tarjeta', 'RFID', 'bateria', '4xAA')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'administracion-de-hoteles' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0103', 'fuente-respaldo-12v-5a-bateria', 'Fuente de respaldo 12V 5A con batería', 'Fuente de alimentación con respaldo de batería, 12 V y 5 A, para paneles de acceso.', g.id, s.id, 690.00, 22, 12, jsonb_build_object('voltaje', '12 V', 'respaldo', 'Sí')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'fuentes-de-alimentacion' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0104', 'arco-detector-metales', 'Arco detector de metales para acceso', 'Arco detector de metales de 6 zonas, sensibilidad ajustable, para control de acceso.', g.id, s.id, 24900.00, 2, 12, jsonb_build_object('zonas', '6', 'sensibilidad', 'Ajustable')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'inspeccion-por-rayos-x-y-explosivos' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0105', 'lectora-proximidad-125khz-exterior', 'Lectora de proximidad 125 KHz para exterior', 'Lectora de proximidad de 125 KHz con protección IP65 para instalación en exterior.', (select id from public.brands where slug = 'axelock'), g.id, s.id, 980.00, 30, 12, jsonb_build_object('frecuencia', '125 KHz', 'uso', 'Exterior IP65')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'lectoras-y-tarjetas' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0106', 'controlador-acceso-2-puertas-tcpip', 'Controlador de acceso de 2 puertas TCP/IP', 'Controlador de acceso para 2 puertas con conectividad TCP/IP.', (select id from public.brands where slug = 'axelock'), g.id, s.id, 3450.00, 8, 24, jsonb_build_object('puertas', '2', 'conectividad', 'TCP/IP')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'paneles-de-control-de-acceso' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0107', 'supresor-picos-linea-red-rj45', 'Supresor de picos para línea de red RJ45', 'Supresor de picos para línea de red Gigabit, puerto RJ45.', g.id, s.id, 349.00, 45, 12, jsonb_build_object('puerto', 'RJ45', 'velocidad', 'Gigabit')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'proteccion-contra-descargas' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0108', 'barra-panico-puerta-emergencia', 'Barra de pánico para puerta de emergencia', 'Barra de pánico para puertas de emergencia de hasta 1.2 metros de ancho.', g.id, s.id, 1250.00, 15, 12, jsonb_build_object('ancho_puerta', 'Hasta 1.2 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'sistemas-de-emergencia' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0109', 'licencia-software-tiempo-asistencia', 'Licencia de software de tiempo y asistencia', 'Licencia perpetua de software de tiempo y asistencia para hasta 50 usuarios.', g.id, s.id, 2890.00, 50, 12, jsonb_build_object('usuarios', 'Hasta 50', 'tipo', 'Perpetua')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'software-de-asistencia' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0110', 'torniquete-medio-cuerpo-lector', 'Torniquete de medio cuerpo con lector integrado', 'Torniquete de medio cuerpo con soporte para lector de credenciales integrado.', g.id, s.id, 15900.00, 4, 24, jsonb_build_object('tipo', 'Medio cuerpo', 'lector', 'Integrado')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'torniquetes-y-puertas-de-cortesia' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0111', 'interfono-analogico-2-hilos-frente-calle', 'Interfono analógico 2 hilos con frente de calle', 'Interfono analógico de 2 hilos, incluye frente de calle para portón.', g.id, s.id, 1590.00, 16, 12, jsonb_build_object('hilos', '2', 'frente_de_calle', 'Incluido')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'videoporteros-e-interfonos' and s.parent_id is null where g.slug = 'control-de-acceso';

-- Automatización e Intrusión (9)
insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0100', 'boton-panico-inalambrico-alarma', 'Botón de pánico inalámbrico para alarma', 'Botón de pánico inalámbrico compatible con paneles de alarma RF.', (select id from public.brands where slug = 'perimetra'), g.id, s.id, 390.00, 40, 12, jsonb_build_object('conectividad', 'RF inalámbrico')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'accesorios' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0101', 'apagador-inteligente-wifi-empotrable', 'Apagador inteligente WiFi empotrable', 'Apagador inteligente de 1 canal con conectividad WiFi, control por app.', g.id, s.id, 349.00, 55, 12, jsonb_build_object('conectividad', 'WiFi', 'canales', '1')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'automatizacion-casa-inteligente' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0102', 'cable-22awg-2-hilos-alarma-100m', 'Cable calibre 22 AWG 2 hilos para alarma, 100 m', 'Bobina de cable calibre 22 AWG de 2 hilos, 100 metros, para instalación de alarmas.', g.id, s.id, 590.00, 30, 12, jsonb_build_object('calibre', '22 AWG', 'longitud', '100 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cables' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0103', 'bateria-12v-7ah-panel-alarma', 'Batería de respaldo 12V 7 Ah para panel de alarma', 'Batería sellada de respaldo de 12 V y 7 Ah para paneles de alarma.', g.id, s.id, 299.00, 45, 12, jsonb_build_object('voltaje', '12 V', 'capacidad', '7 Ah')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'energia' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0104', 'gabinete-metalico-panel-alarma', 'Gabinete metálico para panel de alarma', 'Gabinete metálico con chapa para proteger el panel de alarma.', g.id, s.id, 590.00, 20, 12, jsonb_build_object('material', 'Acero', 'chapa', 'Sí')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'gabinetes-y-carcasas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0105', 'generador-niebla-seguridad-disuasion', 'Generador de niebla de seguridad para disuasión', 'Generador de niebla de seguridad, cubre hasta 200 m³, activación con la alarma.', (select id from public.brands where slug = 'perimetra'), g.id, s.id, 12900.00, 3, 12, jsonb_build_object('cobertura', 'Hasta 200 m3')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'generadores-de-niebla' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0106', 'sensor-movimiento-pir-exterior', 'Sensor de movimiento PIR para exterior', 'Sensor de movimiento PIR con protección IP65 para uso en exterior.', (select id from public.brands where slug = 'perimetra'), g.id, s.id, 890.00, 28, 12, jsonb_build_object('tipo', 'PIR', 'uso', 'Exterior IP65')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'proteccion-perimetral' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0107', 'letrero-disuasion-zona-vigilada', 'Letrero de disuasión "Zona vigilada"', 'Letrero de disuasión "Zona vigilada por videocámaras", resistente a intemperie.', g.id, s.id, 89.00, 100, 12, jsonb_build_object('material', 'Aluminio')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'senalamientos' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0108', 'estacion-manual-emergencia-rotura-cristal', 'Estación manual de emergencia con rotura de cristal', 'Estación manual de emergencia con activación por rotura de cristal.', g.id, s.id, 450.00, 25, 12, jsonb_build_object('activacion', 'Rotura de cristal')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'sistemas-de-emergencia' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

-- Energía y Climatización (7)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0100', 'bomba-sumergible-1hp-agua', 'Bomba sumergible 1 HP para agua', 'Bomba sumergible de 1 HP para extracción de agua.', g.id, s.id, 2890.00, 10, 12, jsonb_build_object('potencia', '1 HP')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'bombeo' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0101', 'regulador-voltaje-1000va', 'Regulador de voltaje 1000 VA para equipo sensible', 'Regulador de voltaje de 1000 VA para proteger equipo electrónico sensible.', (select id from public.brands where slug = 'voltara'), g.id, s.id, 890.00, 25, 12, jsonb_build_object('capacidad', '1000 VA')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'calidad-de-la-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0102', 'minisplit-1-tonelada-inverter', 'Minisplit 1 tonelada Inverter', 'Minisplit de 1 tonelada con tecnología Inverter, alta eficiencia energética.', g.id, s.id, 8990.00, 6, 12, jsonb_build_object('capacidad', '1 Ton', 'tecnologia', 'Inverter')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'climatizacion-refrigeracion' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0103', 'fuente-poder-12v-10a-rack', 'Fuente de poder de 12V 10A para rack', 'Fuente de poder de 12 V y 10 A para montaje en rack.', (select id from public.brands where slug = 'voltara'), g.id, s.id, 990.00, 20, 12, jsonb_build_object('voltaje', '12 V', 'corriente', '10 A')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'fuentes-de-poder' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0104', 'gabinete-metalico-exterior-ip65', 'Gabinete metálico para exterior IP65', 'Gabinete metálico con protección IP65 para instalaciones de exterior.', g.id, s.id, 1290.00, 15, 12, jsonb_build_object('proteccion', 'IP65')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'gabinetes-y-cajas' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0105', 'pdu-basica-8-contactos-rack', 'PDU básica de 8 contactos para rack', 'PDU básica con 8 contactos para distribución de energía en rack.', g.id, s.id, 690.00, 30, 12, jsonb_build_object('contactos', '8')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'pdu' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0106', 'protector-sobretension-linea-electrica', 'Protector de sobretensión para línea eléctrica', 'Protector de sobretensión para línea eléctrica de equipo de seguridad.', (select id from public.brands where slug = 'voltara'), g.id, s.id, 450.00, 35, 12, jsonb_build_object('tipo', 'Línea eléctrica')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'protectores-sobretensiones' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

-- Cableado Estructurado (8)
insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0100', 'patch-panel-24-puertos-cat6', 'Patch panel de 24 puertos Cat 6', 'Patch panel de 24 puertos, categoría 6, para montaje en rack.', (select id from public.brands where slug = 'fibranet'), g.id, s.id, 990.00, 20, 12, jsonb_build_object('puertos', '24', 'categoria', 'Cat 6')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cableado-de-cobre' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0101', 'canaleta-plastica-25x25mm-2m', 'Canaleta plástica 25x25 mm, 2 m', 'Canaleta plástica de 25x25 mm, tramo de 2 metros, para instalación de cable visto.', g.id, s.id, 59.00, 150, 6, jsonb_build_object('medida', '25x25 mm', 'longitud', '2 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'canalizacion' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0102', 'charola-escalerilla-galvanizada-30cm', 'Charola tipo escalerilla galvanizada 30 cm', 'Charola tipo escalerilla de acero galvanizado, 30 cm de ancho.', g.id, s.id, 890.00, 18, 12, jsonb_build_object('ancho', '30 cm', 'material', 'Acero galvanizado')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'charola' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0103', 'conector-rj45-cat6-blindado-paquete-100', 'Conector RJ-45 Cat 6 blindado, paquete de 100', 'Paquete de 100 conectores RJ-45 blindados, categoría 6.', (select id from public.brands where slug = 'fibranet'), g.id, s.id, 690.00, 40, 6, jsonb_build_object('categoria', 'Cat 6', 'piezas', '100')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'conectores' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0104', 'jumper-fibra-monomodo-lc-lc-3m', 'Jumper de fibra óptica monomodo LC-LC 3 m', 'Jumper de fibra óptica monomodo, conectores LC-LC, 3 metros.', (select id from public.brands where slug = 'fibranet'), g.id, s.id, 189.00, 60, 12, jsonb_build_object('tipo', 'Monomodo', 'conectores', 'LC-LC', 'longitud', '3 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'fibra-optica' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0105', 'pdu-monitoreable-16-contactos', 'PDU monitoreable de 16 contactos', 'PDU monitoreable de forma remota, 16 contactos, para rack de datos.', g.id, s.id, 3490.00, 8, 12, jsonb_build_object('contactos', '16', 'monitoreo', 'Remoto')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'pdu' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0106', 'rack-abierto-12ur', 'Rack abierto de 12 UR', 'Rack abierto de piso, 12 unidades de rack (UR).', g.id, s.id, 2190.00, 12, 24, jsonb_build_object('unidades', '12 UR')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'racks-y-gabinetes' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0107', 'transceptor-sfp-1g-monomodo-20km', 'Transceptor SFP 1G monomodo 20 km', 'Transceptor SFP de 1G, fibra monomodo, alcance de 20 km.', (select id from public.brands where slug = 'fibranet'), g.id, s.id, 590.00, 25, 12, jsonb_build_object('velocidad', '1G', 'alcance', '20 km')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'transceptores-de-fibra-mini-gbics' and s.parent_id is null where g.slug = 'cableado-estructurado';

-- ── Fotos del bulk — misma URL ya usada arriba para cada GRUPO (no hay
-- foto real por subcategoría todavía), agrupadas por prefijo de SKU.
insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/7364948/pexels-photo-7364948.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku like 'SGQ-VV-01%';

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13657415/pexels-photo-13657415.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku like 'SGQ-CA-01%';

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13168513/pexels-photo-13168513.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku like 'SGQ-AI-01%';

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/4254165/pexels-photo-4254165.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku like 'SGQ-EC-01%';

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku like 'SGQ-CE-01%';

commit;
