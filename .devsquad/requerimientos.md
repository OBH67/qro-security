# Requerimientos — Plataforma de ventas SG Querétaro

Fase: **BSA (análisis de negocio)** · Fecha: 2026-09-19
Fuente de negocio: `docs/contexto-negocio.md`
Referencia visual del sitio público: `index.html` + `support.js` + `uploads/` (demo de Claude Design, no rehacer)

---

## 0. Cómo leer este documento

- **Prioridad**: `V1` (sin esto la plataforma no sirve) · `V1.5` (debería estar, puede esperar al primer parche) · `Futuro` (idea válida, lejana) · `No por ahora` (fuera de alcance por decisión).
- **Tamaño**: S / M / L, a ojo, para ayudar a planear — no son horas.
- **Dep.**: historias de las que depende.
- Cada historia tiene criterios de aceptación verificables. Si un criterio depende
  de una respuesta del cliente final, aparece marcado con `⚠ PA-n` y está listado
  en la sección 8 (Preguntas abiertas).

---

## 1. Objetivo y definición de éxito

Poner en línea una tienda donde un cliente de SG Querétaro pueda encontrar un
producto entre ~1,000–1,050 SKUs, generar un pedido, pagar por transferencia y
subir su comprobante, mientras el dueño administra pedidos, inventario y catálogo
desde un panel propio y recibe aviso inmediato por WhatsApp de cada pago.

**La v1 es exitosa si:** un pedido real puede recorrer completo el ciclo
`Pendiente de pago → Comprobante recibido → Listo para envío → Enviado → Entregado`
sin que nadie del equipo tenga que tocar la base de datos a mano, y el dueño puede
dar de alta y editar productos sin ayuda técnica.

**No es objetivo de la v1:** cobrar en línea, facturar ante el SAT, ni sustituir
al asesor de ventas (el trato humano sigue existiendo: "un agente te contacta en
máximo 24 h").

---

## 2. Actores

| Actor | Descripción | Autenticado |
|---|---|---|
| **Visitante** | Navega catálogo y contenido público sin cuenta. Puede armar carrito. | No |
| **Cliente** | Visitante con cuenta. Genera pedidos, sube comprobantes, pide devoluciones y consulta su saldo a favor. | Sí |
| **Administrador** | El dueño de SG Querétaro. Gestiona todo el backoffice. ⚠ PA-6: ¿uno solo o varios con permisos distintos? | Sí |
| **Sistema** | Procesos automáticos: envío de notificación WhatsApp/correo, cálculo de totales, cambio de estados derivados. | — |

---

## 3. Glosario (lenguaje del negocio, a respetar en código y UI)

- **Grupo**: categoría de primer nivel (Videovigilancia, Control de Acceso, …). 6 grupos.
- **Subcategoría**: segundo nivel dentro de un grupo. Un producto pertenece a exactamente un grupo y una subcategoría.
- **SKU**: identificador único del producto, visible al cliente y buscable.
- **Folio**: identificador legible del pedido; se usa como **referencia de la transferencia bancaria**. Debe ser corto, único y no adivinable en secuencia obvia.
- **Comprobante**: imagen o PDF de la transferencia que sube el cliente.
- **Saldo a favor**: crédito monetario a nombre del cliente, originado por devoluciones aprobadas. Solo se gasta dentro de la plataforma, nunca se reembolsa en efectivo.
- **Solicitud de servicio**: lead de monitoreo, guardias o financiamiento. No es un pedido.

---

## 4. Épicas e historias de usuario

### Épica A — Catálogo y descubrimiento de producto

**A1 · Navegar el catálogo por grupo y subcategoría** — `V1` · `M`
> Como visitante quiero explorar los productos por grupo y subcategoría para llegar al tipo de equipo que necesito sin conocer marcas ni SKUs.

Criterios de aceptación:
1. El menú principal muestra los 6 grupos; al entrar a un grupo se listan sus subcategorías confirmadas.
2. Al elegir una subcategoría se listan sus productos con foto principal, nombre, marca, SKU, precio con IVA y disponibilidad.
3. Un producto sin stock aparece marcado como "Agotado" y no se puede agregar al pedido.
4. Un producto inactivo no aparece en ninguna vista pública, ni siquiera por URL directa.
5. El listado pagina o carga por bloques: nunca se cargan los ~1,050 productos de golpe.
6. Los grupos "Cableado Estructurado" y "GPS, Telemática y Equipamiento Vehicular" existen aunque sus subcategorías estén pendientes ⚠ PA-1.

**A2 · Buscar por producto, marca o SKU** — `V1` · `M` · Dep. A1
> Como visitante quiero buscar por nombre, marca o SKU para encontrar un equipo específico rápido.

Criterios:
1. La búsqueda encuentra coincidencias parciales en nombre, marca y SKU.
2. Es tolerante a acentos y mayúsculas ("camara" encuentra "Cámara").
3. Devuelve resultados en menos de 1 segundo con el catálogo completo cargado.
4. Si no hay resultados, se ofrece una salida útil (categorías sugeridas o contacto con asesor), no una pantalla vacía.

**A3 · Ver la ficha de un producto** — `V1` · `S` · Dep. A1
> Como visitante quiero ver fotos, precio, existencias y especificaciones técnicas para decidir si el equipo me sirve.

Criterios:
1. Muestra: nombre, marca, SKU, grupo/subcategoría, precio con IVA incluido, estado de stock, galería de fotos y tabla de especificaciones técnicas.
2. Las especificaciones son pares clave–valor editables por el administrador, no un texto libre rígido.
3. Indica explícitamente que el precio incluye IVA.
4. Sobre el envío muestra el mensaje acordado hasta que se defina la política ⚠ PA-4.

**A4 · Filtrar y ordenar resultados** — `V1.5` · `M` · Dep. A1
> Como visitante quiero filtrar por marca, rango de precio y disponibilidad, y ordenar por precio, para comparar opciones.

Criterios: los filtros son combinables; el estado de los filtros se refleja en la URL para poder compartirla; "solo disponibles" es un filtro de un clic.

---

### Épica B — Carrito y cuenta de cliente

**B1 · Armar un pedido (carrito)** — `V1` · `M` · Dep. A3
> Como visitante quiero agregar productos y cantidades a mi pedido antes de decidir comprar.

Criterios:
1. Se puede agregar, cambiar cantidad y quitar productos.
2. El carrito sobrevive a recargas de página y, si hay sesión iniciada, al cambio de dispositivo.
3. No permite agregar más unidades que el stock disponible; si el stock bajó desde que se agregó, avisa al cliente antes de generar el pedido.
4. Muestra subtotal y total con IVA incluido en todo momento.

**B2 · Crear cuenta e iniciar sesión** — `V1` · `M`
> Como cliente quiero una cuenta para generar pedidos y darles seguimiento.

Criterios:
1. Registro con: nombre completo, correo, teléfono celular y contraseña.
2. Correo único; contraseña almacenada con hash, nunca en texto plano.
3. Verificación del correo antes o inmediatamente después del primer pedido ⚠ decisión de arquitectura (impacta fricción vs. calidad del lead).
4. Existe recuperación de contraseña por correo.
5. Se puede iniciar sesión, cerrar sesión, y la sesión expira tras un periodo razonable de inactividad.

**B3 · Registrar dirección de envío y datos fiscales** — `V1` · `S` · Dep. B2
> Como cliente quiero guardar mi dirección y, si quiero factura, mis datos fiscales, para no recapturarlos en cada compra.

Criterios:
1. Dirección completa: calle y número, colonia, municipio, estado, CP, referencias, teléfono de contacto.
2. Datos fiscales **opcionales**: RFC, razón social, régimen fiscal, uso de CFDI.
3. Si el cliente marca "quiero factura", los datos fiscales pasan a ser obligatorios y el RFC se valida en formato.
4. Los datos fiscales se guardan solo para captura; **no se emite factura automática** (fuera de alcance).

---

### Épica C — Pedido, pago por transferencia y comprobante (núcleo del negocio)

**C1 · Generar el pedido y recibir instrucciones de pago** — `V1` · `L` · Dep. B1, B3
> Como cliente quiero confirmar mi pedido y recibir los datos exactos para transferir, para poder pagar.

Criterios:
1. Requiere sesión iniciada y dirección de envío completa.
2. Al confirmar se crea el pedido en estado **Pendiente de pago** con folio único.
3. Se muestran: beneficiario, banco, CLABE, cuenta, **importe exacto** y la instrucción de usar el **folio como referencia**.
4. El pedido congela el precio de cada producto al momento de generarse: un cambio posterior de precio no altera un pedido existente.
5. Los mismos datos de pago se le envían por correo y quedan visibles en "Mis pedidos".
6. Los datos bancarios son configurables por el administrador, nunca están escritos en el código.
7. El descuento de inventario ocurre en el momento que defina ⚠ PA-2.

**C2 · Subir el comprobante de pago** — `V1` · `M` · Dep. C1
> Como cliente quiero subir la foto o captura de mi transferencia para que validen mi pago.

Criterios:
1. Acepta imagen (JPG/PNG/HEIC) y PDF, con límite de tamaño claro y mensaje de error entendible si se excede.
2. Valida tipo real de archivo, no solo la extensión.
3. Al subirlo, el pedido pasa a **Comprobante recibido** y se registra fecha/hora.
4. El cliente ve el aviso de compra completada y el mensaje de que un agente lo contactará **en máximo 24 horas**.
5. Se puede reemplazar el comprobante si aún no ha sido validado.
6. El comprobante **no es públicamente accesible**: solo lo ven su dueño y el administrador, mediante enlaces firmados o equivalente.

**C3 · Notificar al administrador por WhatsApp** — `V1` · `L` · Dep. C2
> Como administrador quiero recibir por WhatsApp el comprobante y los datos del pedido para validar el pago sin entrar al panel.

Criterios:
1. Al subirse un comprobante, el administrador recibe: imagen del comprobante + folio + lista de productos y cantidades + monto total.
2. Si el envío falla, se reintenta y el evento queda registrado; **la falla de WhatsApp nunca impide que el pedido cambie de estado**.
3. Existe además notificación por correo como respaldo.
4. El número destino es configurable, no está escrito en el código.
5. El proveedor técnico lo define la arquitectura ⚠ PA-5. La notificación es **solo saliente** en v1.

**C4 · Consultar mis pedidos y su estado** — `V1` · `M` · Dep. C1
> Como cliente quiero ver en qué va cada pedido para saber si ya lo validaron o ya salió.

Criterios: lista con folio, fecha, total y estado actual; detalle con productos, dirección, comprobante subido e historial de cambios de estado con fecha; el cliente recibe correo en cada cambio de estado.

**C5 · Administrar y avanzar pedidos desde el panel** — `V1` · `L` · Dep. C2
> Como administrador quiero revisar el comprobante y mover el pedido de estado para operar la venta.

Criterios:
1. Lista de pedidos filtrable por estado y buscable por folio, cliente o correo.
2. El detalle muestra el comprobante en grande junto al importe esperado, para comparar de un vistazo.
3. Acciones: validar pago → **Listo para envío**; luego **Enviado**; luego **Entregado**.
4. Solo se permiten transiciones válidas del flujo; cada cambio guarda quién y cuándo.
5. Puede rechazar un comprobante, lo que regresa el pedido a **Pendiente de pago** con un motivo que el cliente ve.
6. Puede **Cancelar** un pedido en cualquier estado previo a Enviado, liberando el stock apartado. La cancelación automática por plazo vencido está resuelta en D2.7 (PA-7: 3 días).

---

### Épica D — Devoluciones y saldo a favor

**D1 · Solicitar una devolución** — `V1` · `M` · Dep. C4
> Como cliente quiero solicitar la devolución de un producto que ya recibí para recuperar su valor como saldo.

Criterios:
1. Solo sobre pedidos en estado **Entregado** y dentro del plazo permitido ⚠ PA-3.
2. El cliente elige producto(s), cantidad, motivo y declara la condición: **sellado de fábrica**, **abierto/sin empaque original** u **otro** (dañado, incompleto, etc.).
3. Puede adjuntar fotos.
4. El sistema muestra el **saldo estimado** según la condición declarada (100% / 70% / "lo revisa un asesor"), aclarando que es estimado y sujeto a revisión.
5. Queda claro en la UI que la devolución **nunca es en efectivo**.

**D2 · Resolver devoluciones desde el panel** — `V1` · `M` · Dep. D1
> Como administrador quiero aprobar o rechazar devoluciones y aplicar el saldo correspondiente.

Criterios:
1. Bandeja de solicitudes con su estado (Pendiente, Aprobada, Rechazada).
2. Al aprobar, el administrador confirma o corrige el porcentaje; el sistema propone 100% para sellado y 70% para abierto.
3. Aprobar genera un movimiento de saldo a favor a nombre del cliente, con monto, fecha, motivo y pedido de origen.
4. Rechazar exige un motivo, que el cliente ve.
5. Toda alta de saldo queda en una bitácora inmutable (nunca se edita un saldo "a mano" sin rastro).
6. **Reingreso al catálogo (PA-10, decisión 2026-09-20):** al aprobar la devolución, la pieza física **sí puede volver a venderse**, pero **nunca se mezcla con el stock de producto nuevo**:
   - **Sellado de fábrica** → reingresa como producto **nuevo**: se suma 1 al `stock` del SKU original, mismo precio.
   - **Abierto, usado, incompleto o de exhibición** → el administrador puede publicarlo como una **ficha de producto "Usado"** aparte: mismo SKU base + sufijo, con su propio precio (lo fija el admin, no el original), su propia foto real de la pieza y un motivo visible para el cliente (ej. "Usado para prueba", "Incompleto — faltan piezas", "Unidad de exhibición"). Stock siempre 1, porque es una pieza física única, no un lote.
   - Publicar la ficha de "Usado" es una acción explícita del admin, no automática: puede decidir no revenderla.
7. **Cancelación automática de pedido no pagado (PA-7, decisión 2026-09-20):** un pedido en **Pendiente de pago** se cancela solo a los **3 días** de generado si no se sube comprobante, con recordatorio por correo al día 2. El plazo es configurable desde H4, no está fijo en el código.

**D3 · Usar el saldo a favor en un pedido** — `V1` · `M` · Dep. D2, C1
> Como cliente quiero aplicar mi saldo a favor a una compra nueva para pagar menos por transferencia.

Criterios:
1. El saldo disponible es visible en la cuenta y en el momento de generar el pedido.
2. El cliente elige aplicar todo o parte del saldo; el importe a transferir se recalcula y es el que aparece en las instrucciones de pago.
3. Si el saldo cubre el total, el pedido **no requiere comprobante de transferencia** (no hay nada que transferir), pero **tampoco avanza automáticamente**: entra a la misma bandeja de revisión del administrador que un pedido con comprobante, mostrando el detalle del saldo aplicado en vez de una imagen. El administrador confirma manualmente antes de que pase a **Listo para envío** — ver RN-11. Decisión de la dueña (2026-09-20): ningún pedido cambia de estado sin una acción humana explícita, precisamente porque validar un pago es un juicio humano sobre un documento no estructurado (captura de pantalla, foto de ticket, PDF del banco), y ese mismo criterio de "alguien lo revisa antes de avanzar" debe aplicar parejo, sin atajos por el método de pago.
4. El saldo se descuenta al generar el pedido y se devuelve íntegro si el pedido se cancela.
5. El saldo nunca puede quedar negativo; toda aplicación es una operación atómica.

---

### Épica E — Servicios (leads)

**E1 · Solicitar un servicio** — `V1` · `M`
> Como visitante quiero pedir información de monitoreo, guardias o financiamiento para que me contacte un asesor.

Criterios:
1. Sección de Servicios visible en la navegación principal, con las tres líneas descritas.
2. Formulario con: tipo de cliente (particular / negocio / empresa), nombre, correo, teléfono, servicio de interés, ubicación (estado, municipio, dirección o geolocalización) y tipo de inmueble.
3. No requiere cuenta.
4. Protegido contra spam (captcha o equivalente) y con límite de envíos por IP.
5. Confirmación al usuario en pantalla y por correo.
6. Queda claro que el servicio **no se compra en línea**.

**E2 · Bandeja de solicitudes de servicio** — `V1` · `S` · Dep. E1
> Como administrador quiero ver las solicitudes en un solo lugar para darles seguimiento.

Criterios: lista filtrable por tipo de servicio y estado (Nueva / En seguimiento / Cerrada); detalle con todos los datos capturados; notificación al administrador por el canal que se defina ⚠ PA-5b; exportable a CSV.

---

### Épica F — Catálogo desde el panel

**F1 · Alta, edición y baja de productos** — `V1` · `L`
> Como administrador quiero gestionar mis productos sin ayuda técnica para mantener precios y existencias al día.

Criterios:
1. Alta con todos los campos de la ficha; SKU único y validado.
2. Edición de precio, stock, fotos, especificaciones, grupo/subcategoría y estado.
3. "Baja" es desactivación lógica: el producto desaparece del sitio público pero se conserva el historial de pedidos que lo incluyen. **Nunca se borra físicamente un producto con ventas.**
4. Subida de múltiples fotos con orden y foto principal.
5. Cambios de precio y stock quedan en bitácora (quién, cuándo, valor anterior).

**F2 · Carga masiva del catálogo** — `V1` · `L` · Dep. F1
> Como administrador quiero cargar y actualizar cientos de productos desde un archivo para no capturar ~1,050 SKUs a mano.

Criterios:
1. Importación por CSV/Excel con plantilla descargable.
2. Vista previa con validación antes de aplicar: filas correctas, filas con error y el motivo de cada error.
3. Actualiza por SKU si ya existe, crea si no (modo "actualizar o crear").
4. Una fila con error no impide procesar las demás, y el resultado se reporta al final.
5. Permite actualización masiva de solo precio y solo stock.

> **Nota de alcance:** F2 es la diferencia entre una plataforma usable y una inservible con 1,050 SKUs. Se clasifica V1 pese a su tamaño.

**F3 · Administrar grupos y subcategorías** — `V1` · `S` · Dep. F1
> Como administrador quiero crear y editar grupos y subcategorías para reflejar cambios en mi línea de producto.

Criterios: crear/renombrar/reordenar; no se puede eliminar una subcategoría con productos activos sin reasignarlos; los cambios se reflejan en la navegación pública. **Soporta subcategorías anidadas** (2026-09-20): un grupo puede tener subcategorías de un solo nivel o de varios, según lo que el catálogo real necesite — Cableado Estructurado ya confirmó que necesita un nivel adicional (ver `docs/contexto-negocio.md` §14 y `modelo-datos.md` D7). El administrador puede crear una subcategoría "dentro" de otra existente, sin límite de profundidad impuesto por el sistema.

---

### Épica G — Analítica

**G1 · Productos más y menos vendidos** — `V1` · `M` · Dep. C5
> Como administrador quiero saber qué se vende y qué no para decidir qué reabastecer o descontinuar.

Criterios:
1. Ranking de más vendidos y de menos vendidos, por unidades y por importe, con rango de fechas seleccionable.
2. Cuenta solo pedidos con pago validado (de **Listo para envío** en adelante), no pedidos pendientes.
3. Filtrable por grupo y subcategoría.
4. Exportable a CSV.

**G2 · Indicadores de operación** — `V1.5` · `M` · Dep. G1
> Como administrador quiero un tablero con la salud del negocio para actuar a tiempo.

Candidatos (a confirmar ⚠ PA-7): ventas por periodo, ticket promedio, pedidos pendientes de pago con antigüedad, tasa de conversión pedido→pago validado, productos con stock bajo o en cero, tasa de devoluciones y saldo a favor vivo total.

---

### Épica H — Base transversal

**H1 · Traducir el demo visual a un sitio público funcional** — `V1` · `L`
> Como dueña del proyecto quiero que el sitio real conserve el diseño ya aprobado para no rehacer la identidad visual.

Criterios:
1. La paleta, tipografías y lenguaje visual del demo se conservan (`index.html` es la referencia).
2. El sitio es responsive; no hay app nativa.
3. Contraste de texto verificado antes de entregar (la plantilla es de fondo oscuro: alto riesgo de texto ilegible).
4. `index.html`, `support.js` y `uploads/` se conservan como referencia y **no se modifican** (archivos protegidos).

**H2 · Acceso seguro al panel administrativo** — `V1` · `M`
> Como administrador quiero que solo yo pueda entrar al panel.

Criterios: el panel exige autenticación y rol de administrador; ninguna ruta o API administrativa responde a un cliente autenticado normal; contraseñas con hash; intentos de acceso limitados; sesión administrativa con expiración más corta.

**H3 · Correos transaccionales** — `V1` · `M`
> Como cliente quiero recibir correo en los momentos clave para no tener que estar revisando el sitio.

Criterios: correos de bienvenida/verificación, recuperación de contraseña, pedido generado con datos de pago, comprobante recibido, pago validado, enviado, entregado y resolución de devolución. Todos con folio y datos de contacto de SG Querétaro.

**H4 · Configuración del sistema** — `V1` · `S` · Cierra el hueco detectado al preparar la fase de diseño (2026-09-20)
> Como administrador quiero editar los datos operativos del negocio sin depender de un despliegue de código.

Criterios:
1. Pantalla de Configuración en el panel, accesible **solo** por el rol `admin` (el rol `inventario` no la ve).
2. Editable ahí: datos bancarios para las instrucciones de pago (banco, beneficiario, CLABE, número de cuenta), correo del administrador, WhatsApp del administrador, plazo en días para solicitar devolución (PA-3), días para cancelar automáticamente un pedido no pagado (PA-7).
3. Los cambios quedan en bitácora: quién, cuándo, valor anterior — mismo criterio que F1.5.
4. Las instrucciones de pago que ve el cliente en C1 siempre leen estos valores de aquí; nunca están fijos en el código.

**H5 · Alcance del rol `inventario`** — `V1` · `S` · Cierra el hueco detectado al preparar la fase de diseño (2026-09-20)
> Como administrador quiero dar acceso limitado a quien solo carga inventario, sin exponerle pedidos ni clientes.

Criterios:
1. El menú del panel para `inventario` muestra únicamente Catálogo (F1, F2, F3): Pedidos, Devoluciones, Solicitudes, Analítica y Configuración **no aparecen en el menú**, no solo quedan bloqueados detrás de un clic.
2. Si escribe a mano una URL fuera de su alcance, recibe una pantalla de acceso denegado clara, en español de negocio, no un error técnico.
3. El panel muestra siempre su nombre y rol, para que quede claro qué cuenta está operando.

**H6 · Pantalla de inicio del panel en V1** — `V1` · `S` · Cierra el hueco detectado al preparar la fase de diseño (2026-09-20)
> Como administrador quiero llegar directo a lo más urgente al entrar al panel, sin esperar un tablero que todavía no existe.

Criterios:
1. Sin G2 (V1.5), el panel del rol `admin` abre directo en la bandeja de Pedidos filtrada por **"Comprobante recibido"** — es la acción pendiente más urgente y repetida.
2. El rol `inventario` abre directo en Catálogo, ya que Pedidos no es parte de su alcance (H5).
3. En V1.5, G2 reemplaza este comportamiento por un tablero real, sin romper la navegación existente.

---

## 5. Reglas de negocio (invariantes del sistema)

- **RN-1** No existe cobro en línea. Ningún flujo puede terminar en un cargo automático.
- **RN-2** Todos los precios se muestran con IVA incluido.
- **RN-3** El folio del pedido es la referencia de la transferencia y debe ser único.
- **RN-4** Un pedido solo avanza en el orden definido; retroceder solo es posible al rechazar un comprobante o al cancelar.
- **RN-5** Las devoluciones nunca generan reembolso en efectivo: siempre saldo a favor.
- **RN-6** Saldo por devolución: 100% si está sellado de fábrica, 70% si está abierto o sin empaque original, revisión manual en cualquier otro caso.
- **RN-7** El saldo a favor solo se usa dentro de la plataforma y nunca puede ser negativo.
- **RN-8** Los servicios (monitoreo, guardias, financiamiento) no son productos y no se venden en línea.
- **RN-9** Un producto con ventas históricas no se elimina, se desactiva.
- **RN-10** El precio de un pedido se congela al generarse.
- **RN-11** Ningún pedido cambia de estado de forma automática. Todo avance —incluido un pedido cubierto al 100% con saldo a favor, que no tiene comprobante que subir— requiere una acción explícita del administrador. La validación de un pago es un juicio humano sobre un documento no estructurado; ese mismo criterio aplica sin excepción, sin importar el método de pago.

---

## 6. Requisitos no funcionales (insumo para el arquitecto)

- **Volumen**: ~1,050 SKUs, con múltiples fotos cada uno. Tráfico esperado bajo-medio (negocio regional); el cuello de botella real es el almacenamiento y entrega de imágenes, no la concurrencia.
- **Rendimiento**: listados y búsqueda por debajo de 1 s percibido; imágenes optimizadas y servidas en tamaños distintos según dispositivo.
- **Disponibilidad**: horario comercial crítico; una caída nocturna es tolerable. No se requiere alta disponibilidad multi-región.
- **Seguridad**: datos personales y fiscales de clientes mexicanos (aplica la LFPDPPP: aviso de privacidad obligatorio). Comprobantes de pago = información sensible, nunca en almacenamiento público. Todo por HTTPS.
- **Secretos**: credenciales bancarias visibles al cliente son dato de configuración, no secreto; las llaves de WhatsApp, correo y base de datos son secretos y van en variables de entorno, **nunca en el repositorio**.
- **Integridad de inventario**: el descuento de stock debe ser atómico para evitar sobreventa con pedidos simultáneos.
- **Auditoría**: cambios de estado de pedido, movimientos de saldo y cambios de precio/stock deben quedar registrados con autor y fecha.
- **Operabilidad**: el administrador es una persona no técnica; el panel debe ser autoexplicativo y tolerante a errores (confirmaciones antes de acciones destructivas).
- **Legales**: aviso de privacidad, términos y condiciones y política de devoluciones publicados en el sitio antes de salir a producción.

---

## 7. Alcance por versión

**V1 (mínimo vendible)**: A1, A2, A3, B1, B2, B3, C1, C2, C3, C4, C5, D1, D2, D3, E1, E2, F1, F2, F3, G1, H1, H2, H3, H4, H5, H6.

**V1.5 (siguiente parche)**: A4 (filtros avanzados), G2 (tablero de indicadores), estados de seguimiento de envío con número de guía, exportaciones adicionales.

**Futuro**: lista de deseos, comparador de productos, cotizaciones formales para empresa, precios diferenciados por tipo de cliente (mayoreo), portal de instaladores/distribuidores, chat en vivo, multi-sucursal.

**No por ahora (decisión explícita, no olvido)**: pasarela de pago en línea, facturación automática vía PAC, app móvil nativa, WhatsApp bidireccional.

---

## 8. Preguntas abiertas

### 8.1 Bloquean la arquitectura o el código (necesitan respuesta antes de implementar)

**Cerradas — decididas por la dueña del proyecto, ya no bloquean nada:**

| # | Pregunta | Decisión final | Dónde vive |
|---|---|---|---|
| ~~PA-2~~ | ¿Cuándo se descuenta el inventario? | **Tres momentos, no uno**: la pieza sigue a la venta al generar el pedido; se **aparta** al subir el comprobante; el stock físico baja al marcar **Enviado**. | `estado.md` #9, `modelo-datos.md` §1, `arquitectura.md` §9.1 |
| ~~PA-6~~ | ¿Uno o varios administradores? | **Dos roles**: `admin` (acceso total) e `inventario` (solo catálogo/stock). | `estado.md` #11 |
| ~~PA-4~~ | ¿Cómo se calcula el envío? | **El asesor lo confirma al marcar "Enviado"**; no se calcula en línea. | `estado.md` #12 |

**Sigue abierta:**

| # | Pregunta | Por qué importa | Recomendación por defecto si no hay respuesta |
|---|---|---|---|
| **PA-5** | ¿Qué proveedor para WhatsApp: Meta Cloud API oficial, Twilio, u otro? | Cambia costo mensual, tiempos de aprobación de Meta (días/semanas) y complejidad. Enviar **imágenes** por WhatsApp requiere API oficial o proveedor; no hay atajo gratuito confiable. | Ya implementado como capa intercambiable en `arquitectura.md` §7.3: correo funcionando desde el día 1, WhatsApp conectable después sin rediseñar nada. **No bloquea el arranque del código**, solo el trámite con Meta (ver §8.3). |

### 8.2 Necesitan respuesta del cliente final, pero no bloquean el arranque

**Cerradas — decididas por la dueña del proyecto:**

| # | Pregunta | Decisión final |
|---|---|---|
| ~~PA-3~~ | Plazo en días para solicitar una devolución | **30 días** naturales desde la entrega (2026-09-20). Configurable en H4. |
| ~~PA-7~~ | ¿Se cancela automáticamente un pedido no pagado? | **Sí, 3 días** desde que se generó el pedido, con recordatorio por correo al día 2 (2026-09-20). Configurable en H4. |
| ~~PA-9~~ | Si el saldo cubre el 100%, ¿se acepta sin comprobante? | **Sí se acepta sin comprobante, pero no avanza automático**: entra igual a revisión del admin (RN-11, §5). |
| ~~PA-10~~ | ¿El producto devuelto reingresa al inventario vendible? | **Sí reingresa, pero nunca como nuevo.** Ver D2.7 y `modelo-datos.md` D6 — se reclasifica como **Usado**, con motivo, precio y stock propios (2026-09-20). |

**Siguen abiertas:**

| # | Pregunta | Efecto |
|---|---|---|
| **PA-1** | Subcategorías finales de *GPS, Telemática y Equipamiento Vehicular*. (Cableado Estructurado ya se cerró el 2026-09-20 — ver `docs/contexto-negocio.md` §14). | Son datos, no estructura. Se cargan cuando lleguen. |
| **PA-8** | Métricas exactas de analítica además de más/menos vendidos. | G1 cubre lo mínimo; G2 se ajusta con la respuesta. |
| **PA-5b** | Canal para las solicitudes de servicio: ¿correo, WhatsApp o ambos? | Sugerido: correo en v1, WhatsApp cuando PA-5 quede resuelto. |
| **PA-11** | ¿Existe ya el catálogo en algún archivo (Excel, ERP, sitio del distribuidor)? | Determina qué tan real es F2 y cuánto trabajo manual de captura habrá. **Es la pregunta de mayor impacto en el calendario de lanzamiento.** |

### 8.3 Dependencias externas a gestionar desde ya (tardan, no dependen del código)

1. **Alta de WhatsApp Business API** ante Meta o el proveedor elegido: requiere número dedicado y verificación del negocio; suele tardar días o semanas.
2. **Dominio y correo corporativo** para que los correos transaccionales no caigan en spam (requiere configurar SPF/DKIM/DMARC).
3. **Datos bancarios oficiales** de SG Querétaro para las instrucciones de pago.
4. **Textos legales**: aviso de privacidad, términos y condiciones, política de devoluciones.
5. **Contenido del catálogo**: fotos y especificaciones de ~1,050 productos.

---

## 9. Riesgos identificados

| Riesgo | Impacto | Mitigación propuesta |
|---|---|---|
| El catálogo de ~1,050 SKUs no existe en formato digital estructurado | Alto — puede retrasar el lanzamiento más que todo el desarrollo junto | Resolver PA-11 de inmediato; priorizar F2 (carga masiva); considerar lanzar con un subconjunto de los productos más vendidos |
| Trámite de WhatsApp Business API más lento de lo esperado | Medio | Correo como canal principal desde el día 1; WhatsApp como capa intercambiable |
| Sobreventa por pedidos simultáneos | Medio | Definir PA-2 y hacer atómico el descuento de stock |
| Validación manual de pagos como cuello de botella humano | Medio | Panel con comparación rápida importe vs. comprobante; notificación inmediata; medir el tiempo de validación |
| Fraude con comprobantes falsificados | Medio | La validación humana es la única defensa en v1; el panel debe mostrar el importe esperado junto al comprobante y conservar el historial |
| Contraste ilegible al llevar el tema oscuro del demo al panel admin | Bajo-medio | Verificación de contraste obligatoria en la fase de diseño y antes de la primera entrega |

---

## 10. Estado del entregable

Completo para pasar a arquitectura, **condicionado** a que se respondan las cuatro
preguntas de la sección 8.1 o se acepten las recomendaciones por defecto.
