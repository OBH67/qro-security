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

> **Reinicio de subcategorías (2026-09-20):** toda la información de
> subcategorías y sub-subcategorías se eliminó a petición de la dueña del
> proyecto — las versiones anteriores tenían inconsistencias. Los 6 grupos
> principales siguen siendo los correctos y no cambian. Las subcategorías de
> cada grupo se vuelven a levantar desde cero, grupo por grupo, y se
> documentarán aquí conforme la dueña las vaya confirmando.

Los 6 grupos principales (confirmados, sin cambio):
- **Videovigilancia (10): Cámaras IP y NVRs · Cámaras y DVRs HD TurboHD / AHD / HD-TVI · Cables y Conectores · Energía · Kits - Sistemas Completos · Monitores Pantallas y Mobiliario · Servidores / Almacenamiento · Software VMS y Analíticas · Videograbadoras Móviles, Dash Cams y Body Cams · Videoporteros e Interfonos** (2026-09-20; sin sub-subcategoría todavía). De las 11 que muestra la navegación, solo "Drones, Robots e Industrial" no tiene punto de marcado y se descarta.
- **Control de Acceso (14 subcategorías, filtrado por punto de marcado — de las 21 que muestra la navegación, se descartan Control de Rondas Para Vigilantes, Detectores de Metal, Equipo Blindado, Identificación y Credencialización, Protección de Mercancía (EAS), Refacciones, Teclados Autónomos):**
  - Acceso vehicular: Accesorios · Barreras Vehiculares · Pilonas o Bolardos · Puertas Abatibles y Corredizas · Refacciones · Semáforos, Radares y Señalización · Topes, Picos y Reductores
  - Accesorios: Bisagras y Pasacables · Botones de Salida · Cables para Control de Acceso · Cierrapuertas · Contactos Magnéticos · Controles Inalámbricos · Mobiliario de Apoyo · Sensores para Puertas Automáticas · Tarjetas de Relevador · Tarjetas y Tags
  - Administración de Hoteles: (sin sub-subcategoría)
  - Biométricos: Accesorios · Enroladores y Lectores USB · Para Control de Acceso · Para Tiempo y Asistencia / Checadores
  - Cerraduras: Accesorios · Autónomas / Inteligentes · Cerrojos y Candados Digitales · Chapas y Contrachapas · Eléctricas · Mecánicas y de Perno
  - Fuentes de Alimentación: Baterías · Fuentes de Respaldo · Transformadores
  - Inspección por Rayos X y Explosivos: Escaneo Corporal · Sistemas de Inspección por Rayos X
  - Lectoras y Tarjetas: Bluetooth · Enroladores y Lectores USB · MIFARE®/iCLASS (13.56 MHz) · NFC / QR · Proximidad (125 KHz) · SEOS · UHF/ RFID
  - Paneles de Control de Acceso: Accesorios · Controladores de Acceso · Licencias y Softwares
  - Protección Contra Descargas: Coaxial · Corriente Alterna y Directa · Redes
  - Sistemas de Emergencia: Barras y Accesorios para Puertas de Emergencia · Estaciones y Señalización de Emergencia · Puertas de Emergencia
  - Software de Asistencia: Control de Acceso · Estacionamientos · Tiempo y Asistencia
  - Torniquetes y Puertas de Cortesía: Puertas de Cortesía · Refacciones · Torniquetes (Cuerpo Completo y Medio)
  - Videoporteros e Interfonos: Accesorios · Intercomunicadores e Interfonos · Intercomunicadores por Radio · Multiapartamentos · Videoporteros Analógicos · Videoporteros IP
- **Automatización e Intrusión (10 subcategorías, filtrado por punto de marcado — de las 19 que muestra la navegación, se descartan Centrales de Monitoreo, Contactos Magnéticos, Detectores / Sensores, Lutron, Módulos de Expansión, Paneles de Alarma, Paneles de Alarma y Accesorios Hikvision, Teclados, Total Connect Honeywell):**
  - Accesorios: Botones de Pánico · Controles Remotos · Estaciones de Jalón · Sirenas y Estrobos
  - Automatización - Casa Inteligente: Apagadores y Atenuadores Inteligentes · Cámaras Wi-Fi Inteligentes · Cerraduras Inteligentes · Climatización y Termostatos · Difusores y Aromatización Inteligente · Enchufes y Contactos Inteligentes · Focos y Tiras LED Inteligentes · Garage · Hubs, Gateways y Pantallas de Control · Persianas y Cortinas Inteligentes · Sensores y Relevadores · Videoporteros y Timbres Inteligentes · Z-Wave · Zigbee
  - Cables: (sin sub-subcategoría)
  - Cercas Eléctricas: Accesorios · Aisladores · Energizadores · Postes
  - Energía: Baterías · Fuentes de Poder · Protección Contra Sobretensiones · Transformadores
  - Gabinetes y Carcasas: Carcasas · Gabinetes para Paneles · Gabinetes para Sirena
  - Generadores de Niebla: (sin sub-subcategoría)
  - Protección Perimetral: Cámaras Térmicas · Cable Sensor Perimetral · Sensores de Movimiento para Exterior · Sensores de Rayo Láser y PIRs Inteligentes · Sensores Fotoeléctricos y Microondas · Transmisor RF Largo Alcance
  - Señalamientos: (sin sub-subcategoría)
  - Sistemas de Emergencia: Accesorios para Puertas de Emergencia · Atención Sociosanitaria · Barras para Puertas de Emergencia · Estaciones Manuales de Emergencia · Puertas de Emergencia · Señalización
- **Energía y Climatización (10 subcategorías, todas con punto de marcado — ninguna se descarta):**
  - Baterías y Cargadores: Baterías · Cargadores de Baterías · Cargadores de Vehículos (EV Chargers) · Terminales y Accesorios
  - Bombeo: Bombas · Variadores y Accesorios
  - Calidad de la Energía: Accesorios para Tierra Física · Banco de Capacitores · Pararrayos · Reguladores · Supresores de Picos · Tierras Físicas
  - Climatización / Refrigeración: Accesorios / Herramientas · Aire de Precisión (Telecom) · Boilers / Refrigeradores / Congeladores · Minisplits y Aire Acondicionado · Refacciones · Termostatos y Control HVAC
  - Energía Solar: Accesorios / Cables / Jumpers · Baterías Solares · Controladores de Carga MPPT/PWM · Inversores Aislados (Off Grid) · Inversores Híbridos / Cargadores · Inversores Interconexión (On Grid) · Kits de Montajes Solares · Kits Solares · Módulos Solares · Microinversores · Montajes para Módulos · Piezas Montajes Solares · Protecciones Vcc
  - Fuentes de Poder: Accesorios / Divisores / Conectores · Convertidores (Vcc a Vcc) · Eliminadores y Transformadores de Pared · Fuente de Alimentación con Respaldo · Fuentes con Distribuidor · Fuentes de Salida Única · Fuentes de Uso Industrial / Riel DIN · Fuentes en Kit
  - Gabinetes y Cajas: Cajas para Conexiones / Registros · Gabinetes para Exterior / Interior · Gabinetes y Accesorios Antiexplosión · Glándulas y Accesorios
  - PDU: Básicos · Especializados
  - Protectores Sobretensiones: Protección Térmica
  - Respaldo de Energía: Accesorios · Estaciones de Energía Portables · Generadores de Diesel · Generadores de Gasolina · Remolques para Energía Solar · UPS / No Break
- **Cableado Estructurado (9): Cable - Bobinas · Cableado de Cobre · Canalización · Charola · Conectores · Fibra Óptica · PDU · Racks y Gabinetes · Transceptores de Fibra / (Mini-GBICs)** (2026-09-20; sin sub-subcategoría todavía). Todas las subcategorías que muestra la navegación aplican, sin descartar ninguna.
- **GPS, Telemática y Equipamiento Vehicular (1): Video Móvil y Cámaras Vehiculares** (2026-09-20; sin sub-subcategoría todavía). De todas las que muestra la navegación (barras de luz, estrobos, IoT/GPS/Telemática, LoRaWAN, luces auxiliares, señalización industrial, sirenas...), solo esta aplica al catálogo de SG Querétaro.

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
- Subcategorías finales de los 6 grupos (reinicio 2026-09-20 — ver §3).
- Momento exacto del descuento de inventario (al generar el pedido o al validar el comprobante).
- Plazo en días para solicitar una devolución.
- Cómo se calcula o cobra el envío (actualmente el demo dice "se confirma con tu asesor").
- Proveedor/mecanismo técnico para la integración de WhatsApp.
- Si habrá más de un usuario administrador y si necesitan permisos distintos entre ellos.
- Qué métricas exactas debe mostrar la analítica del panel, además de más y menos vendidos.

## 13. Referencias
- `prompt-claude-design-sg-queretaro.md`: especificación visual completa (paleta, tipografía, componentes, pantallas) ya usada para generar el demo del sitio público en Claude Design. **Nota:** este archivo no se encuentra actualmente en el repositorio; el demo renderizado (`index.html`, `support.js`, `uploads/`) sí está y funciona como referencia visual vigente.
