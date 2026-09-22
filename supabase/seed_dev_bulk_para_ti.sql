-- seed_dev_bulk_para_ti.sql — datos de MUESTRA, SOLO PARA DESARROLLO/DEMO.
-- NO ejecutar contra el proyecto de producción.
--
-- Contexto: tras el bulk de 43 productos (uno por subcategoría raíz que no
-- tenía ninguno), `obtenerParaTi()` (src/server/db/queries/catalogo.ts)
-- elige sus hasta 8 pestañas por la subcategoría con MÁS productos — pero
-- casi todas tenían exactamente 1, así que cada pestaña mostraba un solo
-- producto: el riel no tenía nada que desplazar, la "pasarela" se veía
-- estática. Este script agrega 6 productos MÁS a 6 subcategorías raíz ya
-- existentes (repartidas en 5 grupos distintos, para que "Para Ti" siga
-- mostrando variedad de departamentos) para que esas pestañas lleguen a
-- 7-8 productos cada una — el tope real de `obtenerParaTi()` es 9 por
-- pestaña — y el riel de verdad se desplace.
--
-- Requiere haber aplicado `seed.sql` y `seed_dev.sql` antes (mismo
-- criterio que `seed_dev_bulk_43_productos.sql`). Los SKU usan el rango
-- 0200-0299 por prefijo para no chocar con los ya usados (0001-0099 y
-- 0100-0111). Fotos: se reutiliza la misma URL ya asignada a cada GRUPO
-- en `seed_dev.sql` (no hay foto real por producto todavía, PA-11 sigue
-- abierta) — no se introducen URLs nuevas sin verificar.
--
-- Un solo uso: no es idempotente (no valida si ya corrió antes). Si se
-- vuelve a correr, va a fallar por SKU/slug duplicado — eso es
-- intencional, mejor que insertar dos veces sin darte cuenta.

begin;

-- Videovigilancia · Cámaras IP y NVRs (ya tenía 2 → llega a 8)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0200', 'camara-ip-domo-4mp-audio-bidireccional', 'Cámara IP domo 4 MP con audio bidireccional', 'Cámara IP domo de 4 MP con micrófono y bocina integrados para comunicación en dos vías.', g.id, s.id, 1450.00, 22, 24, jsonb_build_object('resolucion', '4 MP', 'audio', 'Bidireccional')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0201', 'camara-ip-ptz-25x-zoom-optico', 'Cámara IP PTZ 25x zoom óptico', 'Cámara IP motorizada PTZ con 25x de zoom óptico y seguimiento automático.', g.id, s.id, 8900.00, 6, 24, jsonb_build_object('zoom', '25x óptico', 'ptz', 'Sí')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0202', 'camara-ip-termica-exterior', 'Cámara IP térmica para exterior', 'Cámara térmica IP para detección por temperatura, ideal para perímetros y monitoreo nocturno.', g.id, s.id, 15900.00, 3, 24, jsonb_build_object('tipo', 'Térmica', 'uso', 'Exterior')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0203', 'nvr-16-canales-4k-16-poe', 'NVR 16 canales 4K con 16 puertos PoE', 'Grabador de red de 16 canales, resolución 4K, con 16 puertos PoE integrados.', g.id, s.id, 7290.00, 5, 24, jsonb_build_object('canales', '16', 'resolucion', '4K', 'poe', 'Sí')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0204', 'camara-ip-wifi-2mp-interior', 'Cámara IP WiFi 2 MP para interior', 'Cámara IP WiFi compacta de 2 MP para interior, configuración desde app móvil.', g.id, s.id, 690.00, 40, 12, jsonb_build_object('resolucion', '2 MP', 'conectividad', 'WiFi')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-VV-0205', 'camara-ip-cubo-3mp-vision-nocturna-color', 'Cámara IP cubo 3 MP con visión nocturna a color', 'Cámara IP tipo cubo de 3 MP con visión nocturna a color asistida por luz blanca.', g.id, s.id, 850.00, 28, 12, jsonb_build_object('resolucion', '3 MP', 'vision_nocturna', 'A color')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null where g.slug = 'videovigilancia';

-- Control de acceso · Biométricos (ya tenía 1 → llega a 7)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0200', 'lector-biometrico-huella-500-usuarios', 'Lector biométrico de huella para 500 usuarios', 'Lector de huella digital con capacidad para 500 usuarios y registro de asistencia.', g.id, s.id, 2190.00, 16, 12, jsonb_build_object('capacidad', '500 usuarios', 'metodo', 'Huella')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0201', 'lector-tarjeta-proximidad-rfid-125khz', 'Lector de tarjeta de proximidad RFID 125 kHz', 'Lector de proximidad RFID 125 kHz para control de acceso con tarjeta.', g.id, s.id, 890.00, 30, 12, jsonb_build_object('frecuencia', '125 kHz', 'metodo', 'Tarjeta')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0202', 'lector-biometrico-teclado-tarjeta', 'Lector biométrico con teclado y tarjeta', 'Lector biométrico triple: huella, teclado numérico y tarjeta de proximidad.', g.id, s.id, 2790.00, 12, 12, jsonb_build_object('metodo', 'Huella, teclado y tarjeta')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0203', 'terminal-biometrica-facial-ip65', 'Terminal biométrica con reconocimiento facial IP65', 'Terminal de reconocimiento facial para exterior, grado de protección IP65.', g.id, s.id, 5490.00, 7, 24, jsonb_build_object('metodo', 'Reconocimiento facial', 'ip', 'IP65')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0204', 'lector-huella-exterior-intemperie', 'Lector de huella para exterior resistente a la intemperie', 'Lector de huella digital con carcasa resistente a la intemperie, para instalación exterior.', g.id, s.id, 1990.00, 14, 12, jsonb_build_object('metodo', 'Huella', 'uso', 'Exterior')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0205', 'lector-biometrico-multimodal-app', 'Lector biométrico multimodal con app móvil', 'Lector biométrico multimodal (huella y rostro) administrable desde app móvil.', g.id, s.id, 3490.00, 9, 12, jsonb_build_object('metodo', 'Huella y rostro', 'app', 'Sí')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null where g.slug = 'control-de-acceso';

-- Control de acceso · Cerraduras (ya tenía 1 → llega a 7)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0210', 'cerradura-electromagnetica-1200lb-doble', 'Cerradura electromagnética 1200 lb doble puerta', 'Chapa magnética de 1200 lb para instalación en puerta doble.', g.id, s.id, 1890.00, 10, 12, jsonb_build_object('fuerza', '1200 lb', 'voltaje', '12/24 V')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0211', 'chapa-electrica-fail-safe-12v', 'Chapa eléctrica de fallo seguro (fail-safe) 12V', 'Chapa eléctrica de fallo seguro, se desbloquea automáticamente al cortarse la energía.', g.id, s.id, 780.00, 24, 12, jsonb_build_object('tipo', 'Fail-safe', 'voltaje', '12 V')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0212', 'cerrojo-electrico-embutido-madera', 'Cerrojo eléctrico embutido para puerta de madera', 'Cerrojo eléctrico embutido, discreto, para instalación en puertas de madera.', g.id, s.id, 990.00, 18, 12, jsonb_build_object('tipo', 'Embutido', 'material_puerta', 'Madera')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0213', 'cerradura-electronica-teclado-tarjeta', 'Cerradura electrónica con teclado y tarjeta', 'Cerradura electrónica de sobreponer con teclado numérico y tarjeta de proximidad.', g.id, s.id, 2290.00, 11, 12, jsonb_build_object('metodo', 'Teclado y tarjeta')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0214', 'chapa-magnetica-compacta-280lb', 'Chapa magnética compacta 280 lb', 'Chapa magnética compacta de 280 lb, para puertas de vidrio o marcos angostos.', g.id, s.id, 590.00, 26, 12, jsonb_build_object('fuerza', '280 lb', 'voltaje', '12 V')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CA-0215', 'cerradura-fail-safe-vidrio-templado', 'Cerradura eléctrica de fallo seguro para vidrio templado', 'Cerradura eléctrica fail-safe con herraje para puertas de vidrio templado sin marco.', g.id, s.id, 1690.00, 8, 12, jsonb_build_object('tipo', 'Fail-safe', 'material_puerta', 'Vidrio templado')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null where g.slug = 'control-de-acceso';

-- Automatización e intrusión · Cercas eléctricas (ya tenía 1 → llega a 7)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0200', 'energizador-cerca-electrica-4km-residencial', 'Energizador para cerca eléctrica 4 km, uso residencial', 'Energizador compacto de 4 km, pensado para uso residencial.', g.id, s.id, 1290.00, 20, 12, jsonb_build_object('alcance', '4 km', 'uso', 'Residencial')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0201', 'energizador-solar-cerca-electrica-6km', 'Energizador solar para cerca eléctrica 6 km', 'Energizador con panel solar integrado, para cercas de hasta 6 km sin conexión eléctrica.', g.id, s.id, 3290.00, 9, 12, jsonb_build_object('alcance', '6 km', 'alimentacion', 'Solar')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0202', 'kit-aisladores-cerca-electrica-50pz', 'Kit de aisladores para cerca eléctrica (50 piezas)', 'Kit de 50 aisladores de poste para instalación de cerca eléctrica.', g.id, s.id, 380.00, 60, 12, jsonb_build_object('piezas', '50')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0203', 'cable-acero-inoxidable-cerca-electrica-500m', 'Cable de acero inoxidable para cerca eléctrica, 500 m', 'Bobina de cable de acero inoxidable calibre 12.5 para cerca eléctrica, 500 metros.', g.id, s.id, 1590.00, 15, 12, jsonb_build_object('longitud', '500 m', 'material', 'Acero inoxidable')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0204', 'letrero-advertencia-cerca-electrificada-10pz', 'Letrero de advertencia para cerca electrificada (10 piezas)', 'Paquete de 10 letreros de advertencia reglamentarios para cerca electrificada.', g.id, s.id, 220.00, 70, 12, jsonb_build_object('piezas', '10')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-AI-0205', 'panel-control-sirena-cerca-electrica', 'Panel de control con sirena para cerca eléctrica', 'Panel de control con sirena integrada para supervisión de cerca eléctrica.', g.id, s.id, 990.00, 17, 12, jsonb_build_object('sirena', 'Integrada')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null where g.slug = 'automatizacion-e-intrusion';

-- Energía y climatización · Respaldo de energía (ya tenía 1 → llega a 7)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0200', 'no-break-3000va-linea-interactiva', 'No-break 3000 VA en línea interactiva', 'No-break de 3000 VA, tecnología línea interactiva, con 6 contactos regulados.', g.id, s.id, 6490.00, 6, 12, jsonb_build_object('capacidad', '3000 VA', 'tecnologia', 'Línea interactiva')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0201', 'no-break-750va-compacto-pos', 'No-break 750 VA compacto para punto de venta', 'No-break compacto de 750 VA, ideal para equipo de punto de venta.', g.id, s.id, 1290.00, 22, 12, jsonb_build_object('capacidad', '750 VA', 'uso', 'Punto de venta')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0202', 'fuente-poder-conmutada-12v-10a-respaldo', 'Fuente de poder conmutada 12V 10A con respaldo', 'Fuente conmutada 12V 10A con espacio para batería de respaldo.', g.id, s.id, 990.00, 30, 12, jsonb_build_object('voltaje', '12 V', 'corriente', '10 A')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0203', 'gabinete-baterias-sistema-respaldo', 'Gabinete de baterías para sistema de respaldo', 'Gabinete metálico para alojar bancos de baterías de sistemas de respaldo.', g.id, s.id, 1890.00, 10, 12, jsonb_build_object('material', 'Metal')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0204', 'no-break-torre-6000va-trifasico', 'No-break de torre 6000 VA trifásico', 'No-break de torre, 6000 VA, entrada/salida trifásica, para cargas críticas.', g.id, s.id, 24900.00, 2, 24, jsonb_build_object('capacidad', '6000 VA', 'fases', 'Trifásico')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-EC-0205', 'tarjeta-snmp-monitoreo-remoto-ups', 'Tarjeta SNMP para monitoreo remoto de UPS', 'Tarjeta de red SNMP para monitorear y administrar un UPS de forma remota.', g.id, s.id, 2190.00, 12, 12, jsonb_build_object('protocolo', 'SNMP')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null where g.slug = 'energia-y-climatizacion';

-- Cableado estructurado · Cable - Bobinas (ya tenía 2 → llega a 8)
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0200', 'bobina-utp-cat5e-305m', 'Bobina de cable UTP Cat 5e, 305 m', 'Bobina de cable UTP categoría 5e de 305 metros, para interior.', g.id, s.id, 1890.00, 25, 12, jsonb_build_object('categoria', 'Cat 5e', 'longitud', '305 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0201', 'bobina-utp-cat6-exterior-305m', 'Bobina de cable UTP Cat 6 exterior, 305 m', 'Bobina de cable UTP categoría 6 con chaqueta para exterior, 305 metros.', g.id, s.id, 3490.00, 14, 12, jsonb_build_object('categoria', 'Cat 6', 'uso', 'Exterior')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0202', 'bobina-coaxial-rg59-alimentacion-305m', 'Bobina de cable coaxial RG59 con alimentación, 305 m', 'Bobina de cable coaxial RG59 con par de alimentación integrado, 305 metros.', g.id, s.id, 1690.00, 18, 12, jsonb_build_object('tipo', 'RG59', 'longitud', '305 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0203', 'bobina-fibra-optica-monomodo-1km', 'Bobina de cable de fibra óptica monomodo, 1 km', 'Bobina de fibra óptica monomodo, 1 kilómetro, para enlaces de larga distancia.', g.id, s.id, 5490.00, 6, 24, jsonb_build_object('tipo', 'Monomodo', 'longitud', '1 km')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0204', 'bobina-utp-cat6-blindado-futp-305m', 'Bobina de cable UTP Cat 6 blindado (F/UTP), 305 m', 'Bobina de cable Cat 6 blindado F/UTP de 305 metros, para entornos con interferencia.', g.id, s.id, 4290.00, 9, 12, jsonb_build_object('categoria', 'Cat 6 F/UTP', 'longitud', '305 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select 'SGQ-CE-0205', 'bobina-cable-alarma-4-hilos-305m', 'Bobina de cable de alarma 4 hilos, 305 m', 'Bobina de cable para sistemas de alarma, 4 hilos, 305 metros.', g.id, s.id, 890.00, 32, 12, jsonb_build_object('hilos', '4', 'longitud', '305 m')
from public.groups g join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null where g.slug = 'cableado-estructurado';

-- ── Fotos — se reutiliza la misma URL por grupo que ya usa `seed_dev.sql` ──
insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/7364948/pexels-photo-7364948.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-VV-0200', 'SGQ-VV-0201', 'SGQ-VV-0202', 'SGQ-VV-0203', 'SGQ-VV-0204', 'SGQ-VV-0205');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13657415/pexels-photo-13657415.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-CA-0200', 'SGQ-CA-0201', 'SGQ-CA-0202', 'SGQ-CA-0203', 'SGQ-CA-0204', 'SGQ-CA-0205', 'SGQ-CA-0210', 'SGQ-CA-0211', 'SGQ-CA-0212', 'SGQ-CA-0213', 'SGQ-CA-0214', 'SGQ-CA-0215');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13168513/pexels-photo-13168513.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-AI-0200', 'SGQ-AI-0201', 'SGQ-AI-0202', 'SGQ-AI-0203', 'SGQ-AI-0204', 'SGQ-AI-0205');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/4254165/pexels-photo-4254165.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-EC-0200', 'SGQ-EC-0201', 'SGQ-EC-0202', 'SGQ-EC-0203', 'SGQ-EC-0204', 'SGQ-EC-0205');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-CE-0200', 'SGQ-CE-0201', 'SGQ-CE-0202', 'SGQ-CE-0203', 'SGQ-CE-0204', 'SGQ-CE-0205');

commit;
