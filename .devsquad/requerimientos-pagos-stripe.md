# Épica P — Pagos en línea con Stripe (tarjeta, OXXO, SPEI) + mejoras asociadas

> Anexo a `.devsquad/requerimientos.md`. Versión 2 — 2026-09-24.
> Estado: **borrador BSA con las decisiones de la dueña ya incorporadas**.

## 0. Contexto y límites del alcance

- Modelo de cobro: **solo pagos únicos por pedido** (Stripe PaymentIntents).
  Este proyecto **no tiene** suscripciones, mensualidades, planes recurrentes
  ni Stripe Billing. El documento de investigación de mercado que mencionaba
  "mensualidad de monitoreo" era una plantilla genérica; la dueña confirmó que
  esa parte no aplica.
- Métodos en esta fase:
  1. **Tarjeta** (Stripe) — principal, preseleccionado.
  2. **OXXO** (Stripe) — voucher que el cliente paga en tienda.
  3. **SPEI** (Stripe) — transferencia a una CLABE que genera Stripe;
     se concilia sola.
  4. **Transferencia con comprobante** (flujo actual) — se mantiene sin
     cambios, como opción secundaria.
  SPEI vía Stripe y el comprobante manual son cosas distintas: en el primero
  Stripe confirma el pago; en el segundo un humano lee un comprobante.
- Interfaz: **Stripe Payment Element embebido** dentro del sitio. El cliente
  nunca sale a una página externa.
- Sin MSI. Sin CFDI (decisión #4 se mantiene).
- Comisiones de Stripe: las absorbe el negocio.
- Arranque en **modo prueba** (tarjetas de prueba oficiales, p. ej.
  `4242 4242 4242 4242`; OXXO y SPEI también tienen simulación en test).
- No se construye un panel de transacciones propio: las transacciones se
  consultan en el **Stripe Dashboard** (ver §5, tarea de configuración).

## 1. Reglas de negocio nuevas / modificadas

- **RN-1 (modificada):** métodos disponibles: tarjeta (preseleccionada),
  OXXO, SPEI y transferencia con comprobante.
- **RN-11 (intacta, se extiende a todos los métodos):** ningún pedido pasa a
  "Listo para envío" sin aprobación humana. Un pago confirmado por Stripe
  (tarjeta, OXXO o SPEI) entra a la **misma bandeja de revisión** que un
  comprobante.
- **RN-12:** el estado de pago lo determina solo un webhook de Stripe con
  firma verificada (o una consulta a la API desde el servidor), nunca el
  navegador.
- **RN-13:** el inventario se aparta **al iniciar el intento de pago** con
  cualquier método, reutilizando `apartar_pedido()`. Si ya no hay disponible,
  el intento se rechaza antes de generar cobro, voucher o CLABE.
- **RN-14 (vida del apartado):** tarjeta **30 minutos**; OXXO y SPEI hasta
  que venza su instrucción de pago (propuesta: **2 días**, configurable en
  H4; ver arquitectura §4). Al vencer se libera el apartado y el pedido vuelve
  a "pendiente de pago".
- **RN-15:** mientras un pago de Stripe está en curso, el pedido está en
  **"pago en proceso"**, no en la bandeja del admin.
- **RN-7 (se extiende):** el saldo a favor se combina con cualquier método de
  Stripe; se cobra solo la diferencia.
- **PA-7 (se extiende):** la cancelación automática a los 3 días aplica igual
  a pedidos con un intento de Stripe abandonado.
- **RN-16:** si el admin rechaza un pago de Stripe que ya se cobró, el monto
  se acredita como **saldo a favor** (nunca reembolso a tarjeta). Definitivo.
- **RN-6 (modificada):** al aprobar una devolución, el admin elige un
  porcentaje entero entre **10% y 100%**; siempre va a saldo a favor.

## 2. Historias de usuario (MoSCoW)

### P1 · Elegir método de pago en el checkout — Must
- P1.1 Opciones visibles: Tarjeta (preseleccionada), OXXO, SPEI y
  Transferencia con comprobante.
- P1.2 El comprobante conserva exactamente el flujo actual.
- P1.3 Con saldo aplicado, se muestra y se cobra solo la diferencia.
- P1.4 Si el saldo cubre el 100%, no hay selector (flujo RN-11 actual).
- P1.5 Se indica el tiempo de confirmación de cada método (tarjeta:
  inmediato; OXXO: hasta 1 día hábil tras pagar en tienda; SPEI: minutos).
- P1.6 OXXO respeta los límites de monto de Stripe (confirmar el máximo
  vigente; si el total lo supera, la opción aparece deshabilitada con motivo).

### P2 · Pagar con tarjeta — Must
- P2.1 Los datos de tarjeta se capturan en el Payment Element; nunca tocan
  nuestro servidor (PCI SAQ A).
- P2.2 Se aparta el inventario antes de crear el cobro (RN-13).
- P2.3 Idempotency key en cada llamada a Stripe que crea algo.
- P2.4 3-D Secure lo maneja el Payment Element.
- P2.5 Al terminar, el cliente ve "Pago recibido, en revisión"; el estado real
  depende del webhook.
- P2.6 Si falla o pasan 30 min sin pagar, se libera el apartado y el cliente
  puede reintentar o cambiar de método.

### P3 · Pagar en OXXO — Must
- P3.1 Al elegir OXXO se aparta el inventario y se genera un voucher
  (referencia + código de barras + monto + fecha límite).
- P3.2 Pantalla "Tu ficha de pago OXXO", con la opción de descargar o
  imprimir el voucher; el voucher también queda visible en el detalle del
  pedido en "Mis pedidos".
- P3.3 El pedido queda en "pago en proceso" hasta el webhook de pago.
- P3.4 Si el voucher vence sin pagarse, se libera el apartado.

### P4 · Pagar con SPEI — Must
- P4.1 Al elegir SPEI se aparta el inventario y se muestran la CLABE, el
  banco, el beneficiario, la referencia y el monto exacto que genera Stripe.
- P4.2 Botones para copiar la CLABE y el monto; los mismos datos quedan
  visibles en el detalle del pedido.
- P4.3 El pedido queda en "pago en proceso" hasta el webhook.
- P4.4 Si llega un pago parcial o de más, el pedido no avanza y queda
  marcado para revisión del admin (ver arquitectura §4.3).
- P4.5 Si vence el plazo sin pago, se libera el apartado.

### P5 · Webhook de Stripe seguro e idempotente — Must
- P5.1 Firma verificada; firma inválida → 400 y no se toca nada.
- P5.2 Cada `event.id` se procesa una sola vez.
- P5.3 Pago exitoso (cualquier método) → bandeja de revisión + la misma
  notificación al admin que un comprobante.
- P5.4 Fallo, cancelación o vencimiento → se libera el apartado.
- P5.5 Monto y moneda se validan contra el pedido.

### P6 · Revisión manual de un pago de Stripe — Must
- P6.1 La bandeja muestra el método (Tarjeta/OXXO/SPEI), el monto, la fecha,
  el estado en Stripe, la marca y los últimos 4 dígitos (tarjeta) y un enlace
  al pago en el Stripe Dashboard.
- P6.2 Botón "Consultar estado en Stripe" (lee `PaymentIntent.status` desde
  el servidor).
- P6.3 Aprobar → `validar_pago()` → "Listo para envío".
- P6.4 Rechazar un pago ya cobrado → saldo a favor (RN-16).

### P7 · Apartado al iniciar el intento de pago — Must
- P7.1 Mismo candado de `apartar_pedido()`; sin lógica paralela.
- P7.2 Dos clientes compitiendo por la última pieza: el segundo recibe un
  error claro, con cualquier método.
- P7.3 Liberación automática según la vida del apartado (RN-14).

### P8 · Aviso "Quedan X" en el catálogo público — Should
- Tarjeta de producto y PDP: si el disponible está entre 1 y 2, "Quedan X".
  Requiere diseño aprobado (no existe en `index.html`). Independiente de Stripe.

### P9 · Porcentaje libre al aprobar una devolución — Should
- Entero de 10 a 100, validado en servidor y en BD, siempre a saldo a favor,
  con registro de quién lo eligió. Independiente de Stripe.

### P10 · Extensibilidad — Must (técnico)
- Cada método es una estrategia detrás de una interfaz común; agregar un
  método no edita los existentes ni el flujo de pedido.

## 3. No funcionales
- Secretos de Stripe solo en variables de entorno del servidor, capturados a
  mano por la dueña.
- Todo evento de webhook queda registrado.
- Llaves de prueba y de producción separadas.

## 4. Fuera de alcance (explícito)
Suscripciones o mensualidades de cualquier tipo, Stripe Billing, eventos
`invoice.*` y `customer.subscription.*`, MSI, CFDI, reembolsos a tarjeta, un
panel propio de transacciones.

## 5. Tareas de configuración (dueña, no código)
1. Crear la cuenta de Stripe (RFC, cuenta bancaria) y activar OXXO y
   *bank transfers* (SPEI) en Settings → Payment methods.
2. Dar acceso al Dashboard a quien ella decida con un **rol restringido**
   (sin acceso a llaves API, configuración de la cuenta ni administración de
   usuarios; p. ej. un rol de solo lectura o de soporte — revisar la lista de
   roles vigente de Stripe).
3. Capturar ella misma las llaves de prueba en `.env.local` y en Vercel.
4. Registrar el endpoint del webhook en el Dashboard (el equipo le indica la
   URL y los eventos).
