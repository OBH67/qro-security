# Contexto de negocio — Plataforma de ventas Seguridad General Querétaro (SG Querétaro)

> Documento fuente redactado por la dueña del proyecto. Es la entrada de negocio
> para el equipo de agentes (BSA, Arquitecto, Diseñador, Coder). No define UI (eso
> ya está resuelto en `prompt-claude-design-sg-queretaro.md`, usado para generar el
> demo visual del sitio público); define el negocio, las reglas y lo que el sistema
> debe hacer.

## 1. Resumen
- Cliente: Seguridad General Querétaro (SG Querétaro), distribuidor de equipo de seguridad electrónica y tecnología, con sede en Querétaro, México.
- Objetivo: una plataforma de ventas en línea, sin pasarela de pago, donde el cliente compra por transferencia bancaria validada manualmente mediante comprobante, más un panel administrativo para el dueño.
- Estado actual: existe el demo de diseño (UI) del sitio público, construido en Claude Design. Falta todo lo funcional: frontend real, backend, panel administrativo e integraciones.
- Catálogo: entre 1,000 y 1,050 SKU aproximadamente, según el cliente.

## 2. Superficies del sistema
1. Sitio público (tienda): catálogo, cuenta de cliente, pedidos, comprobantes de pago, servicios, devoluciones.
2. Panel administrativo (dueño): pedidos, stock, catálogo, analítica de ventas. Aún no tiene diseño de UI; este documento define su alcance funcional.

## 3. Catálogo de productos
Grupos principales y sus subcategorías (las que el cliente ya confirmó):
- Videovigilancia: Cámaras IP y NVRs · Cámaras y DVRs HD TurboHD/AHD/HD-TVI · Cables y Conectores · Energía · Kits - Sistemas Completos · Monitores, Pantallas y Mobiliario · Servidores/Almacenamiento · Software VMS y Analíticas · Videograbadoras Móviles, Dash Cams y Body Cams · Videoporteros e Interfonos
- Control de Acceso: Acceso Vehicular · Accesorios · Administración de Hoteles · Biométricos · Cerraduras · Fuentes de Alimentación · Identificación y Credencialización · Inspección por Rayos X y Explosivos · Lectoras y Tarjetas · Paneles de Control de Acceso · Protección Contra Descargas · Sistemas de Emergencia · Software de Asistencia · Teclados Autónomos · Torniquetes y Puertas de Cortesía · Videoporteros e Interfonos
- Automatización e Intrusión: subcategorías actualizadas y ampliadas — ver adenda al final del documento (§15)
- Energía y Climatización: Baterías y Cargadores · Bombeo · Calidad de la Energía · Climatización/Refrigeración · Energía Solar · Fuentes de Poder · Gabinetes y Cajas · PDU · Protectores Sobretensiones · Respaldo de Energía
- Cableado Estructurado: subcategorías confirmadas — ver adenda al final del documento (§14)
- GPS, Telemática y Equipamiento Vehicular: pendiente, el cliente enviará las subcategorías

Un producto pertenece a un grupo y una subcategoría, y necesita al menos: SKU, nombre, marca, precio (con IVA incluido), stock disponible, fotos, especificaciones técnicas y estado (activo/agotado).

## 4. Roles de usuario
- Cliente: navega el catálogo, crea una cuenta, genera pedidos, sube comprobantes de pago, solicita devoluciones y solicita servicios (monitoreo, guardias, financiamiento).
- Administrador (dueño): gestiona pedidos, stock y catálogo; consulta analítica; recibe notificaciones por WhatsApp. Por ahora se asume un solo usuario administrador; confirmar con el cliente si habrá más de uno y si necesitan permisos distintos.

## 5. Flujo de compra (regla central del negocio)
No hay pasarela de pago. El flujo es:
1. El cliente arma su pedido en el catálogo.
2. Para generar el pedido necesita una cuenta con: nombre completo, correo, teléfono celular, dirección de envío completa y, opcionalmente, datos fiscales (RFC, razón social, régimen fiscal, uso de CFDI) si quiere factura.
3. Al generar el pedido, el sistema le muestra los datos bancarios (CLABE, cuenta, beneficiario) y el importe exacto a transferir, usando el folio del pedido como referencia. En este punto la venta queda registrada con estado "Pendiente de pago".
4. El cliente hace la transferencia por su cuenta (fuera del sistema) y regresa a su cuenta para subir la foto o captura del comprobante. El pedido pasa a estado "Comprobante recibido".
5. El sistema muestra al cliente un aviso de compra completada y le indica que un agente de ventas lo contactará en un máximo de 24 horas.
6. El administrador revisa el comprobante en el panel y, al validarlo, cambia el pedido a "Listo para envío". Después lo avanza a "Enviado" y "Entregado".

Estados del pedido: Pendiente de pago → Comprobante recibido → Listo para envío → Enviado → Entregado. (Puede añadirse "Cancelado" si un pedido no se paga en cierto plazo — a definir con el cliente.)

## 6. Notificación al administrador por WhatsApp
Cuando un cliente sube su comprobante, el administrador debe recibir por WhatsApp, en el mismo mensaje o mensajes vinculados:
- La foto o captura del comprobante de pago.
- Los datos del pedido: folio, productos solicitados y cantidades, y monto total.

Pendiente de definir con el cliente: el mecanismo técnico (WhatsApp Business API oficial vs. un proveedor externo tipo Twilio/Meta Cloud API) y si la notificación es solo saliente (aviso) o si en algún momento se necesita bidireccionalidad.

## 7. Inventario
- El cliente maneja entre 1,000 y 1,050 productos.
- El stock se descuenta conforme se van vendiendo los productos.
- Pendiente de definir con el cliente: en qué momento exacto se descuenta el inventario — al generarse el pedido (reservando el stock mientras se espera el pago) o hasta que se valida el comprobante. Esto afecta cómo se maneja la sobreventa si dos clientes piden el mismo producto casi al mismo tiempo.

## 8. Devoluciones
- No se devuelve dinero en efectivo; el valor del producto devuelto se convierte en saldo a favor para usar en compras futuras dentro de la misma plataforma.
- Si el producto viene sellado de fábrica: se devuelve el 100% de su valor como saldo a favor.
- Si el producto viene abierto o sin su empaque original: se devuelve el 70% de su valor como saldo a favor.
- Otros casos (producto dañado, incompleto, etc.) los revisa un asesor manualmente.
- Pendiente de definir con el cliente: el plazo en días para solicitar una devolución después de recibir el pedido.

## 9. Servicios (no son productos del catálogo)
Sección visible en la navegación principal, con tres líneas de negocio adicionales a la venta de equipo:
- Monitoreo de alarmas 24/7
- Guardias de seguridad
- Financiamiento y créditos para la compra de equipo

Estos no se compran en línea: el cliente llena un formulario de solicitud con tipo de cliente (particular, negocio, empresa), datos de contacto, servicio de interés, ubicación (estado, municipio, dirección o geolocalización) y tipo de inmueble. La solicitud debe llegar al administrador (mismo canal a definir: correo, WhatsApp o ambos) para que un agente dé seguimiento.

## 10. Panel administrativo — alcance funcional
Aún sin diseño de UI; el alcance funcional a construir es:
- Pedidos: lista filtrable por estado (Pendiente de pago, Comprobante recibido, Listo para envío, Enviado, Entregado), detalle de cada pedido con el comprobante subido, y la acción de cambiar de estado.
- Stock y catálogo: alta, edición y baja de productos; edición de precio, stock, fotos y especificaciones; administración de grupos y subcategorías.
- Analítica: productos más vendidos y menos vendidos, y otros indicadores que ayuden a decidir qué reabastecer o descontinuar (a definir el set completo de métricas con el cliente).
- Solicitudes de servicio: bandeja con las solicitudes de monitoreo, guardias y financiamiento.
- Devoluciones: bandeja de solicitudes de devolución para aprobar o rechazar, y aplicar el saldo a favor correspondiente.

## 11. Fuera de alcance por ahora
- Pasarela de pago en línea (tarjetas, wallets, etc.).
- Facturación automática vía PAC (por ahora solo se capturan los datos fiscales del cliente).
- App móvil nativa; se asume un sitio web responsive.

## 12. Preguntas abiertas para el cliente
- Subcategorías finales de Cableado Estructurado y de GPS, Telemática y Equipamiento Vehicular.
- Momento exacto del descuento de inventario (al generar el pedido o al validar el comprobante).
- Plazo en días para solicitar una devolución.
- Cómo se calcula o cobra el envío (actualmente el demo dice "se confirma con tu asesor").
- Proveedor/mecanismo técnico para la integración de WhatsApp.
- Si habrá más de un usuario administrador y si necesitan permisos distintos entre ellos.
- Qué métricas exactas debe mostrar la analítica del panel, además de más y menos vendidos.

## 13. Referencias
- `prompt-claude-design-sg-queretaro.md`: especificación visual completa (paleta, tipografía, componentes, pantallas) ya usada para generar el demo del sitio público en Claude Design. **Nota:** este archivo no se encuentra actualmente en el repositorio; el demo renderizado (`index.html`, `support.js`, `uploads/`) sí está y funciona como referencia visual vigente.

## 14. Adenda — Subcategorías reales de Cableado Estructurado (2026-09-20)

La dueña del proyecto compartió la estructura real de navegación de este grupo
(captura de un sitio de referencia del distribuidor). A diferencia de los
demás grupos, aquí las subcategorías tienen **un nivel adicional**: varias
traen su propia lista de sub-subcategorías. Cierra PA-1 para este grupo (GPS
sigue pendiente).

- **Cable - Bobinas**: Categoría 5e · Categoría 6 · Categoría 6A · Categoría 7A
- **Cableado de Cobre**: Cajas Superficiales · Faceplates · Herramientas · Jacks / Plugs · Patch Cords · Patch Panels
- **Canalización**: Accesorios para Canaletas · Canaletas · Cinchos / Corbatas · Ducto Cuadrado · Fijación · Tubería Metálica CONDUIT / Accesorios · Tubería PVC / Registros · PVC
- **Charola**: Accesorios · Charola Mallafil · Charola para Fibra Óptica · Charola Tubular · Charolas Tipo Escalerilla · Charolas Tipo Malla · Charolas Tipo Malla Bimetálica · Curvas Pre-Fabricadas · Montajes · Tapas para Charolas · Uniones
- **Conectores**: Para Redes RJ-45
- **Fibra Óptica**: Cable · Conectores · Distribuidores de Fibra Óptica · Herramientas · Jumpers y Pigtails
- **PDU**: Básicos · Fuente Redundante (ATS) · Medibles · Monitoreables · Switcheables
- **Racks y Gabinetes**: Accesorios para Rack/Gabinetes · Gabinetes para Exterior · Gabinetes para Montaje en Pared · Racks Abiertos · Racks Cerrados
- **Transceptores de Fibra / (Mini-GBICs)**: 100G Duplex · 10G Duplex · 1G Duplex · 200G Duplex · 25G Duplex · 400G Duplex · 40G Duplex · BiDi (1G/10G) · Cables DAC & AOC · Industrial BiDi · Industrial Duplex · RJ45 SFP

Esta estructura de tres niveles (grupo → subcategoría → sub-subcategoría) es
la razón por la que el modelo de datos pasó de dos niveles fijos a un árbol
auto-referenciado — ver `.devsquad/modelo-datos.md` D7.

## 15. Adenda — Subcategorías reales de Automatización e Intrusión (2026-09-20)

La dueña del proyecto compartió la estructura real de navegación de este
grupo (misma fuente que §14). **Esta lista reemplaza** la del §3, que tenía
11 subcategorías — la real tiene 19, con varias sub-subcategorías nuevas
(ej. Lutron, Total Connect Honeywell, Paneles de Alarma) que no estaban en la
versión original marcada como "ya confirmada". No es una corrección menor:
casi duplica el número de subcategorías de este grupo.

- **Accesorios**: Botones de Pánico · Controles Remotos · Estaciones de Jalón · Sirenas y Estrobos
- **Automatización - Casa Inteligente**: Apagadores y Atenuadores Inteligentes · Cámaras Wi-Fi Inteligentes · Cerraduras Inteligentes · Climatización y Termostatos · Difusores y Aromatización Inteligente · Enchufes y Contactos Inteligentes · Focos y Tiras LED Inteligentes · Garage · Hubs, Gateways y Pantallas de Control · Persianas y Cortinas Inteligentes · Sensores y Relevadores · Videoporteros y Timbres Inteligentes · Z-Wave · Zigbee
- **Cables**: (sin sub-subcategoría — se vende directo bajo esta subcategoría)
- **Centrales de Monitoreo**: Comunicadores y Transmisores de Alarma · Receptoras de Alarmas · Software de Monitoreo y Automatización (PSIM): MCDI y Softguard
- **Cercas Eléctricas**: Accesorios · Aisladores · Energizadores · Postes
- **Contactos Magnéticos**: Contacto Magnético Cableado · Contacto Magnético Inalámbrico
- **Detectores / Sensores**: Agua / inundación · Contactos Magnéticos · Fotoeléctricos y Microondas · Humo · Movimiento para Exterior · Movimiento para Interior · Rotura de Vidrios y Cristales · Temperatura · Vibración / Impacto / Sísmico
- **Energía**: Baterías · Fuentes de Poder · Protección Contra Sobretensiones · Transformadores
- **Gabinetes y Carcasas**: Carcasas · Gabinetes para Paneles · Gabinetes para Sirena
- **Generadores de Niebla**: (sin sub-subcategoría)
- **Lutron**: Lutron Caseta Wireless · Lutron Maestro · Lutron RA2 Select · Lutron RadioRa3 · Lutron Vive
- **Módulos de Expansión**: Módulos de Expansión Cableado · Receptores Inalámbricos
- **Paneles de Alarma**: (sin sub-subcategoría propia — ver nota de ambigüedad abajo)
- **Paneles de Alarma y Accesorios Hikvision**: AX HOME Series · AX HUB Series · AX Hybrid Pro KITs · AX Hybrid PRO Series · AX PRO KITs · AX PRO Series
- **Protección Perimetral**: Cámaras Térmicas · Cable Sensor Perimetral · Sensores de Movimiento para Exterior · Sensores de Rayo Láser y PIRs Inteligentes · Sensores Fotoeléctricos y Microondas · Transmisor RF Largo Alcance
- **Señalamientos**: (sin sub-subcategoría)
- **Sistemas de Emergencia**: Accesorios para Puertas de Emergencia · Atención Sociosanitaria · Barras para Puertas de Emergencia · Estaciones Manuales de Emergencia · Puertas de Emergencia · Señalización
- **Teclados**: (sin sub-subcategoría)
- **Total Connect Honeywell**: Accesorios y Servicios · Comunicadores · Paneles de Alarma

**Nota de ambigüedad a confirmar (no bloquea el arranque):** en la captura,
"Paneles de Alarma" y "Paneles de Alarma y Accesorios Hikvision" aparecen como
dos bloques distintos y consecutivos — se transcribieron como dos
subcategorías al mismo nivel, pero podría ser que la segunda en realidad
fuera una sub-subcategoría de la primera (un cuarto nivel). El esquema ya
soporta cualquier profundidad (D7 en `modelo-datos.md`), así que esto es una
decisión de captura de datos, no un problema técnico: se resuelve al cargar
el catálogo real, confirmando con la dueña o con el cliente final.
