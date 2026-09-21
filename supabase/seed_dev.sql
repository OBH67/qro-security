-- seed_dev.sql — datos de MUESTRA, SOLO PARA DESARROLLO LOCAL.
--
-- NO ejecutar contra el proyecto de producción. A diferencia de
-- `seed.sql` (grupos y subcategorías reales, confirmadas por la dueña),
-- todo lo de aquí es contenido de relleno para poder ver y probar el
-- catálogo público (Épica A) mientras no existe el catálogo real de
-- ~1,050 SKU (PA-11, `requerimientos.md` §8.2). Requiere haber aplicado
-- `seed.sql` primero.
--
-- Las fotos usan URLs externas absolutas (no claves de R2): `urlImagenPublica()`
-- (`src/lib/imagenes.ts`) las respeta tal cual porque ya empiezan con
-- "http". En producción esa misma columna guarda una clave de objeto R2.

begin;

-- ── Marcas de muestra ────────────────────────────────────────────────────
-- PA-13 (`modelo-datos.md` §7) sigue abierta: el catálogo real de marcas
-- que distribuye SG Querétaro todavía no está confirmado.
insert into public.brands (name, slug, active) values
  ('Nortvision', 'nortvision', true),
  ('Axelock', 'axelock', true),
  ('Perimetra', 'perimetra', true),
  ('Voltara', 'voltara', true),
  ('Fibranet', 'fibranet', true),
  ('Rutaviva', 'rutaviva', true);

-- ── Atributos filtrables de muestra (solo cámaras, D1) ──────────────────
-- PA-17 sigue abierta para el resto de los grupos.
insert into public.category_attributes (group_id, key, label, data_type, options, filterable, position)
select id, 'resolucion', 'Resolución', 'text', array['2 MP','4 MP','8 MP'], true, 0
from public.groups where slug = 'videovigilancia';

insert into public.category_attributes (group_id, key, label, data_type, options, filterable, position)
select id, 'ip', 'Grado de protección', 'text', null, false, 1
from public.groups where slug = 'videovigilancia';

-- ── Productos de muestra ─────────────────────────────────────────────────
-- Helper: cada INSERT resuelve group_id/subcategory_id por slug para no
-- depender de UUIDs fijos y poder correr este script en cualquier entorno
-- que ya tenga `seed.sql` aplicado.

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, includes, attributes)
select
  'SGQ-VV-0012', 'camara-ip-bala-4mp-deteccion', 'Cámara IP bala 4 MP con detección de personas y vehículos',
  'Cámara IP de línea profesional para exterior, con detección inteligente de personas y vehículos e infrarrojo de 30 metros.',
  (select id from public.brands where slug = 'nortvision'),
  g.id, s.id, 1289.00, 24, 24,
  array['1 cámara IP bala 4 MP', 'Kit de montaje y tornillería', 'Guía rápida de instalación', 'Póliza de garantía de 24 meses'],
  jsonb_build_object('resolucion', '4 MP', 'ip', 'IP67', 'ir', '30 m')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null
where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-VV-0031', 'nvr-8-canales-4k-poe', 'NVR 8 canales 4K con 8 puertos PoE',
  'Grabador de red de 8 canales, resolución 4K, con 8 puertos PoE integrados para simplificar la instalación.',
  (select id from public.brands where slug = 'nortvision'),
  g.id, s.id, 4590.00, 7, 24,
  jsonb_build_object('canales', '8', 'resolucion', '4K', 'poe', 'Sí')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null
where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-VV-0052', 'camara-domo-2mp-turbohd-interior', 'Cámara domo 2 MP TurboHD para interior',
  'Cámara domo TurboHD de 2 MP, ideal para interior en oficinas y comercios.',
  g.id, s.id, 489.00, 50, 12,
  jsonb_build_object('resolucion', '2 MP', 'uso', 'Interior')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-y-dvrs-hd-turbohd-ahd-hd-tvi' and s.parent_id is null
where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-VV-0090', 'body-cam-gps-64gb', 'Body cam con GPS y 64 GB', 'Cámara corporal con GPS integrado y 64 GB de almacenamiento interno.',
  g.id, s.id, 3480.00, 0, 12, jsonb_build_object('almacenamiento', '64 GB', 'gps', 'Sí')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'videograbadoras-moviles-dash-cams-y-body-cams' and s.parent_id is null
where g.slug = 'videovigilancia';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-CA-0008', 'lector-biometrico-huella-rostro-wifi', 'Lector biométrico de huella y rostro con WiFi',
  'Lector biométrico dual (huella y rostro) con conexión WiFi para control de acceso.',
  (select id from public.brands where slug = 'axelock'),
  g.id, s.id, 3950.00, 9, 12, jsonb_build_object('metodo', 'Huella y rostro', 'conectividad', 'WiFi')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'biometricos' and s.parent_id is null
where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-CA-0019', 'cerradura-electromagnetica-600lb', 'Cerradura electromagnética 600 lb con soporte',
  'Chapa magnética de 600 lb con soporte en L, para puertas de acceso controlado.',
  (select id from public.brands where slug = 'axelock'),
  g.id, s.id, 1120.00, 18, 12, jsonb_build_object('fuerza', '600 lb', 'voltaje', '12 V')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'cerraduras' and s.parent_id is null
where g.slug = 'control-de-acceso';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-AI-0006', 'energizador-cerca-electrica-10km', 'Energizador para cerca eléctrica 10 km',
  'Energizador con sirena integrada para cercas eléctricas de hasta 10 km.',
  g.id, s.id, 2390.00, 6, 12, jsonb_build_object('alcance', '10 km', 'voltaje', '12 V')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'cercas-electricas' and s.parent_id is null
where g.slug = 'automatizacion-e-intrusion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-EC-0003', 'no-break-1500va-regulador', 'No-break 1500 VA con regulador',
  'No-break de 1500 VA con regulador de voltaje integrado y pantalla LCD.',
  (select id from public.brands where slug = 'voltara'),
  g.id, s.id, 3299.00, 15, 12, jsonb_build_object('capacidad', '1500 VA', 'contactos', '8')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'respaldo-de-energia' and s.parent_id is null
where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-EC-0021', 'panel-solar-550w-monocristalino', 'Panel solar 550 W monocristalino',
  'Panel solar monocristalino de 550 W, apto para intemperie.',
  (select id from public.brands where slug = 'voltara'),
  g.id, s.id, 2690.00, 30, 300, jsonb_build_object('potencia', '550 W', 'tipo', 'Monocristalino')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'energia-solar' and s.parent_id is null
where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-EC-0027', 'bateria-12v-7ah', 'Batería 12 V 7 Ah', 'Batería sellada de respaldo de 12 V y 7 Ah.',
  g.id, s.id, 289.00, 50, 12, jsonb_build_object('voltaje', '12 V', 'capacidad', '7 Ah')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'baterias-y-cargadores' and s.parent_id is null
where g.slug = 'energia-y-climatizacion';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-CE-0002', 'bobina-utp-cat6-305m', 'Bobina de cable UTP Cat 6, 305 m', 'Bobina de cable UTP categoría 6 de 305 metros, para interior.',
  (select id from public.brands where slug = 'fibranet'),
  g.id, s.id, 2980.00, 20, 12, jsonb_build_object('categoria', 'Cat 6', 'longitud', '305 m')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null
where g.slug = 'cableado-estructurado';

-- Este SKU vive en el tercer nivel del árbol (Cable - Bobinas > Categoría 6A, D7).
insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-CE-0015', 'bobina-utp-cat6a-305m', 'Bobina de cable UTP Cat 6A, 305 m', 'Bobina de cable UTP categoría 6A blindado, 305 metros.',
  (select id from public.brands where slug = 'fibranet'),
  g.id, s2.id, 4150.00, 10, 12, jsonb_build_object('categoria', 'Cat 6A', 'longitud', '305 m')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'cable-bobinas' and s.parent_id is null
join public.subcategories s2 on s2.parent_id = s.id and s2.slug = 'categoria-6a'
where g.slug = 'cableado-estructurado';

insert into public.products (sku, slug, name, description, brand_id, group_id, subcategory_id, price, stock, warranty_months, attributes)
select
  'SGQ-GP-0005', 'rastreador-gps-4g-corte-motor', 'Rastreador GPS 4G con corte de motor',
  'Rastreador vehicular 4G con función de corte de motor remoto y app de monitoreo.',
  (select id from public.brands where slug = 'rutaviva'),
  g.id, s.id, 1650.00, 14, 12, jsonb_build_object('conectividad', '4G', 'corte_de_motor', 'Sí')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'video-movil-y-camaras-vehiculares' and s.parent_id is null
where g.slug = 'gps-telematica-y-equipamiento-vehicular';

-- Un producto "usado" de muestra (D6, reingreso de devolución) para
-- probar la etiqueta de condición en catálogo y ficha de producto.
insert into public.products (sku, slug, name, description, group_id, subcategory_id, price, stock, condition, condition_detail, warranty_months, attributes)
select
  'SGQ-VV-0012-U1', 'camara-ip-bala-4mp-usada', 'Cámara IP bala 4 MP con detección de personas y vehículos (usada)',
  'Misma cámara IP bala 4 MP, unidad usada para prueba en sitio, en buen estado.',
  g.id, s.id, 950.00, 1, 'usado', 'Usado para prueba', 6, jsonb_build_object('resolucion', '4 MP', 'ip', 'IP67')
from public.groups g
join public.subcategories s on s.group_id = g.id and s.slug = 'camaras-ip-y-nvrs' and s.parent_id is null
where g.slug = 'videovigilancia';

-- ── Fotos de muestra (una por producto, URL externa absoluta) ───────────
insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/7364948/pexels-photo-7364948.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-VV-0012', 'SGQ-VV-0012-U1', 'SGQ-VV-0031', 'SGQ-VV-0052', 'SGQ-VV-0090');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13657415/pexels-photo-13657415.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-CA-0008', 'SGQ-CA-0019');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13168513/pexels-photo-13168513.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku = 'SGQ-AI-0006';

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/4254165/pexels-photo-4254165.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-EC-0003', 'SGQ-EC-0021', 'SGQ-EC-0027');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku in ('SGQ-CE-0002', 'SGQ-CE-0015');

insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/7508683/pexels-photo-7508683.jpeg?auto=compress&cs=tinysrgb&w=800', 0
from public.products where sku = 'SGQ-GP-0005';

-- Una segunda foto para el producto que se usa en la demo de galería.
insert into public.product_images (product_id, url, position)
select id, 'https://images.pexels.com/photos/13657415/pexels-photo-13657415.jpeg?auto=compress&cs=tinysrgb&w=800', 1
from public.products where sku = 'SGQ-VV-0012';

-- ── Ventas de muestra (para "Más vendidos") ──────────────────────────────
update public.products set sales_count = 42 where sku = 'SGQ-VV-0012';
update public.products set sales_count = 31 where sku = 'SGQ-VV-0031';
update public.products set sales_count = 28 where sku = 'SGQ-CA-0008';
update public.products set sales_count = 19 where sku = 'SGQ-EC-0003';
update public.products set sales_count = 11 where sku = 'SGQ-VV-0090';

-- ── Reseñas, FAQs y banner de muestra ────────────────────────────────────
insert into public.reviews (author_name, rating, category, title, body, published) values
  ('Ricardo M.', 5, 'Videovigilancia', 'Kit de 8 cámaras', 'Llegó completo y ya configurado. El asesor nos ayudó por WhatsApp a dejar el grabador en la nube.', true),
  ('Laura T.', 5, 'Control de Acceso', 'Biométrico de oficina', 'Dimos de alta 24 gafetes en una tarde. La factura llegó el mismo día de la transferencia.', true),
  ('Jorge C.', 4, 'Energía', 'No-break 1500 VA', 'Pedí el viernes y me lo entregaron el lunes en Juriquilla. Mejor precio que en tienda física.', true);

insert into public.faqs (scope, question, answer, position, active) values
  ('general', '¿Cómo pago mi pedido?', 'Por transferencia o depósito SPEI. Al generar tu pedido te mostramos la CLABE, el beneficiario y el importe exacto. Después subes tu comprobante en Mis pedidos.', 0, true),
  ('general', '¿Cuánto tarda el envío?', 'La guía se genera cuando confirmamos tu comprobante. Tu asesor te confirma el costo y el tiempo de entrega según tu dirección.', 1, true),
  ('general', '¿Puedo pedir factura?', 'Sí. Activa "Quiero factura" al crear tu cuenta o al confirmar el pedido y captura tu RFC, régimen fiscal y uso de CFDI.', 2, true),
  ('general', '¿Cómo funcionan las devoluciones?', 'El valor se devuelve como saldo a favor para comprar productos: 100% si el producto está sellado de fábrica y 70% si está abierto o sin empaque.', 3, true);

insert into public.banners (title, brand_label, image_url, group_id, position, active)
select 'Tu tranquilidad, nuestra prioridad', 'VIDEOVIGILANCIA',
  'https://images.pexels.com/photos/7364948/pexels-photo-7364948.jpeg?auto=compress&cs=tinysrgb&w=1200',
  id, 0, true
from public.groups where slug = 'videovigilancia';

commit;
