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
- Videovigilancia — subcategorías pendientes de recapturar
- Control de Acceso — subcategorías pendientes de recapturar
- **Automatización e Intrusión: Accesorios · Automatización - Casa Inteligente · Cables · Centrales de Monitoreo · Cercas Eléctricas · Contactos Magnéticos · Detectores / Sensores · Energía · Gabinetes y Carcasas · Generadores de Niebla · Lutron · Módulos de Expansión · Paneles de Alarma · Paneles de Alarma y Accesorios Hikvision · Protección Perimetral · Señalamientos · Sistemas de Emergencia · Teclados · Total Connect Honeywell** (2026-09-20; sin sub-subcategoría todavía)
- Energía y Climatización — subcategorías pendientes de recapturar
- Cableado Estructurado — subcategorías pendientes de recapturar
- GPS, Telemática y Equipamiento Vehicular — subcategorías pendientes de recapturar

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
