# Arquitectura — Épica P (Pagos con Stripe: tarjeta, OXXO, SPEI)

> Anexo a `.devsquad/arquitectura.md`. Versión 2 — 2026-09-24. Basado en
> `.devsquad/requerimientos-pagos-stripe.md` v2. No se ha escrito código.
> Antes de implementar, el coder debe leer las firmas reales de
> `apartar_pedido()`, `liberar_apartado()`, `confirmar_comprobante()`,
> `validar_pago()` y `crear_pedido()` (migraciones 0008, 0010, 0011, 0027 y
> posteriores), y la guía de Route Handlers de `node_modules/next/dist/docs/`.
> **Solo pagos únicos (PaymentIntents). No hay nada de suscripciones.**

## 1. Integración: Payment Element embebido (decisión de la dueña)

- Flujo: el servidor crea un **PaymentIntent** → devuelve el `client_secret`
  → el navegador monta el **Payment Element** (`@stripe/react-stripe-js`) y
  llama a `stripe.confirmPayment()`. Los datos de tarjeta van del navegador a
  Stripe; nunca a nuestro servidor (PCI SAQ A).
- Se usa `payment_method_types` explícito por estrategia (no los métodos
  automáticos), para que el método elegido en nuestro selector sea el único
  que ofrece el Payment Element.
- Sustituye la recomendación anterior de Checkout hospedado.
- **Corrección técnica al encargo:** los eventos
  `checkout.session.async_payment_succeeded/failed` solo existen con Checkout
  Sessions. Con Payment Element + PaymentIntents, los eventos equivalentes
  (también para OXXO/SPEI) son `payment_intent.*` (ver §5).
- Nueva variable pública: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

## 2. Strategy: tres estrategias separadas que comparten una pasarela

**Decisión:** `tarjeta`, `oxxo` y `spei` son **estrategias independientes**
que usan por composición un adaptador común `PasarelaStripe`. No se usa una
sola estrategia "stripe" con `payment_method_types` como parámetro.

**Justificación:** los tres métodos difieren en justo lo que la estrategia
debe encapsular:
- vida del apartado (30 min / fecha límite del voucher / plazo de SPEI);
- qué ve el cliente al iniciar (formulario de tarjeta / voucher / CLABE);
- opciones específicas del PaymentIntent (`oxxo.expires_after_days`;
  `customer_balance` + `bank_transfer.type = 'mx_bank_transfer'`, que exige
  un Stripe Customer);
- cómo manejar los montos distintos al esperado (solo SPEI).

Con una sola estrategia, todo eso serían `if (tipo === ...)` internos, que es
lo que el patrón busca evitar. Con tres, agregar otro método de Stripe es
otra estrategia que reutiliza `PasarelaStripe`, sin tocar las demás
(principio abierto/cerrado).

```
src/server/pagos/
  tipos.ts                  // EstrategiaPago, MetodoPago, resultados
  registro.ts               // Map<MetodoPago, EstrategiaPago>
  estrategias/
    comprobante.ts          // envuelve el flujo actual (R2 + confirmar_comprobante)
    tarjeta.ts
    oxxo.ts
    spei.ts
  stripe/
    cliente.ts              // SDK, 'server-only'
    pasarela.ts             // crear/cancelar/consultar PaymentIntent, Customer, idempotency
    webhook.ts              // traduce eventos a funciones SQL
src/app/api/webhooks/stripe/route.ts
```

```ts
type MetodoPago = 'comprobante' | 'tarjeta' | 'oxxo' | 'spei';

interface EstrategiaPago {
  metodo: MetodoPago;
  vigenciaApartado(ctx: CtxPago): Duration;          // 30 min, 2 días, ...
  iniciar(pedido: PedidoParaPago, ctx: CtxPago): Promise<
    | { tipo: 'subir_archivo'; urlFirmada: string }  // comprobante
    | { tipo: 'payment_element'; clientSecret: string } // tarjeta/oxxo/spei
  >;
  instrucciones?(pedidoId: string): Promise<InstruccionesPago | null>; // voucher / CLABE
  detalleRevision(pedidoId: string): Promise<DetallePagoRevision>;
  verificarEnProveedor?(pedidoId: string): Promise<EstadoProveedor | null>;
}
```

El checkout, "Mis pedidos", la bandeja de admin y el cron hablan solo con
`registro.ts`.

## 3. Estados del pedido

**Un solo estado nuevo: `pago_en_proceso`** (inventario apartado, esperando
confirmación de Stripe: el cliente está llenando la tarjeta, tiene un voucher
OXXO sin pagar, o no ha llegado su SPEI). No se crean estados por método. El
detalle fino (`requiere_accion`, `procesando`, `pagado`, `fallido`,
`vencido`) vive en `payments.status`: al admin y a los filtros les interesa
"¿está pagado o no?", no el paso técnico de Stripe, y así no se multiplican
los estados que ya enumeran el panel, el tablero y `PasosPedido.tsx`.

```
pendiente_pago ──iniciar (aparta)──> pago_en_proceso ──webhook ok──> comprobante_recibido (bandeja)
      ^                                   │                                  │ admin aprueba
      └──── vence / falla / cancela ──────┘                                  v
             (liberar_apartado)                                        listo_envio
comprobante: pendiente_pago ──confirmar_comprobante──> comprobante_recibido (sin cambios)
```

Cambios en SQL (sin duplicar la lógica de concurrencia):
- `apartar_pedido()` acepta el estado destino (o se extrae su núcleo de
  candado a una función interna que usan ambos caminos).
- `liberar_apartado()` acepta `pago_en_proceso` como origen; de paso se
  corrige el bug documentado de `from_status`.
- El cron de 3 días (PA-7) cancela también `pago_en_proceso`, cancelando antes
  el PaymentIntent en Stripe.

## 4. Apartado de inventario por método (decisión técnica)

**Decisión: los tres métodos apartan al iniciar, con vida distinta.** No se
optó por "OXXO/SPEI sin apartar hasta confirmar".

| Método | Vida del apartado | Cómo se hace cumplir |
|---|---|---|
| Tarjeta | **30 min** (dueña) | Cron cada 5 min: `pago_en_proceso` con `payments.expires_at` vencido → `paymentIntents.cancel` → `liberar_apartado` |
| OXXO | **2 días** (`oxxo.expires_after_days = 2`, configurable en H4, rango 1–3) | Stripe vence el voucher → evento de fallo/cancelación → liberar; el cron es respaldo |
| SPEI | **2 días** (configurable, rango 1–3) | Cron al vencer: se cancela el PaymentIntent y se libera |

**Por qué apartar también en OXXO/SPEI:** la alternativa (no apartar hasta
confirmar y avisar "no garantizado") significa que un cliente puede pagar en
OXXO una pieza que ya se vendió. Como aquí no hay reembolsos a tarjeta ni en
efectivo, ese cliente terminaría con saldo a favor sin haberlo pedido: una
mala experiencia sobre dinero ya cobrado, y una comisión perdida. Apartar
mantiene la misma lógica que la dueña ya aprobó ("el que se compromete a
pagar, aparta") y reutiliza `apartar_pedido()` sin caminos nuevos.
**Costo del compromiso:** un voucher abandonado bloquea la pieza hasta 2
días. Con ~1,050 SKUs y volumen regional es aceptable, y queda configurable.
Los 2 días caben dentro del límite de 3 días de PA-7.

### 4.1 Pago que llega después de liberar
Si llega un `payment_intent.succeeded` sobre un pedido ya liberado (voucher
pagado en el último minuto, SPEI tardío): se intenta volver a apartar; si hay
stock → bandeja normal; si no → bandeja con una bandera "pagado sin
inventario" y el admin lo resuelve acreditando saldo a favor (RN-16).

### 4.2 Cancelar el PaymentIntent
Siempre se cancela en Stripe antes de liberar, para que el cliente no pueda
pagar un voucher o una CLABE ya vencidos. Para SPEI, si ya había fondos
recibidos, el PaymentIntent no se puede cancelar sin más; se marca para
revisión.

### 4.3 SPEI con monto distinto
Pago parcial o de más: Stripe lo deja en el saldo del Customer. El webhook
no avanza el pedido y lo marca para revisión del admin. No se automatiza la
devolución (seguiría la regla de saldo a favor).

## 5. Webhook

`src/app/api/webhooks/stripe/route.ts`, runtime Node, cuerpo crudo
(`req.text()`), `stripe.webhooks.constructEvent`, excluido de `proxy.ts`.

| Evento | Efecto |
|---|---|
| `payment_intent.succeeded` | `registrar_pago_stripe()` → `comprobante_recibido` + outbox |
| `payment_intent.processing` | solo actualiza `payments.status` |
| `payment_intent.requires_action` | guarda los datos del voucher/CLABE (`next_action`) en `payments` |
| `payment_intent.payment_failed` | tarjeta: permite reintentar dentro de los 30 min; OXXO vencido: liberar |
| `payment_intent.canceled` | liberar (si no se liberó ya) |
| `payment_intent.partially_funded` (SPEI) | marcar para revisión |

Los nombres exactos de los eventos de OXXO y *bank transfer* se verifican
contra la documentación vigente de Stripe antes de codificar. Idempotencia:
`insert ... on conflict (event_id) do nothing` en `stripe_webhook_events`; si
ya existía, se responde 200 sin efecto. Error de BD → 500 para que Stripe
reintente.

## 6. Modelo de datos (aditivo)

- `orders.payment_method` `CHECK`: `+ 'tarjeta' | 'oxxo' | 'spei'`.
- `orders.status` `CHECK`: `+ 'pago_en_proceso'`.
- `order_status_history.source`: `+ 'stripe'`.
- `profiles.stripe_customer_id text unique` (necesario para SPEI; se crea al
  primer uso).
- **`payments`**: `id`, `order_id`, `method`, `provider` ('stripe'),
  `payment_intent_id` unique, `amount_cents`, `currency` 'mxn`,
  `status` ('iniciado'|'requiere_accion'|'procesando'|'pagado'|'fallido'|
  'vencido'|'cancelado'|'revision'), `expires_at`, `instructions jsonb`
  (voucher: referencia, URL, fecha límite; SPEI: CLABE, banco, referencia; nunca
  datos de tarjeta), `card_brand`, `card_last4`, `idempotency_key`,
  `needs_review boolean`, `created_at`, `updated_at`. RLS: el cliente lee lo
  de sus pedidos; escribe solo `service_role`.
- **`stripe_webhook_events`**: `event_id` PK, `type`, `received_at`,
  `processed_at`, `result`, `error`. Solo `service_role`.
- Funciones: `iniciar_pago_stripe(order, method, expires_at)` (aparta + estado
  + fila en `payments`), `registrar_pago_stripe(event_id, pi_id, amount,
  ...)`, `vencer_pagos_stripe()` (para el cron). Todas con el mismo
  `pg_advisory_xact_lock` por pedido.
- Settings H4: `oxxo_expires_days`, `spei_expires_days`.
- `payment_proofs` sin cambios. `returns`: porcentaje 10–100 (P9).

## 7. Variables de entorno

`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (servidor) y
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pública, no es secreta), validadas en
`env.ts`. Las captura la dueña. En local: `stripe listen --forward-to
localhost:3000/api/webhooks/stripe`.

Cron: Vercel Cron cada 5 min para `vencer_pagos_stripe()`. En Vercel Pro los
crons con esa frecuencia están incluidos (confirmar el límite vigente).

## 8. Costo (confirmar tarifas vigentes en stripe.com/mx/pricing)

- Fijo: sin cambio, ~$45–47 USD/mes. Sin mensualidad de Stripe.
- Variable, absorbido por el negocio (más IVA sobre la comisión):
  - Tarjeta nacional ≈ 3.6% + $3 MXN → ≈ 4.18% + $3.48 con IVA.
  - OXXO y SPEI: tarifas propias de Stripe México (OXXO suele ser porcentual
    parecido a tarjeta; SPEI suele ser una cuota fija baja) — **verificar**
    antes de publicar cifras a la dueña.
- Un pago rechazado y acreditado a saldo no recupera la comisión.

## 9. Fuera del código
- **Stripe Dashboard** para consultar transacciones, clientes y pagos. No se
  construye un panel propio. El alta de usuarios con rol restringido es una
  tarea de la dueña (requerimientos §5).

## 10. Riesgos
- Apartados de OXXO/SPEI abandonados bloquean stock hasta 2 días (mitigado:
  configurable).
- Pagos tardíos tras el vencimiento (§4.1).
- SPEI con monto distinto (§4.3).
- El estado nuevo obliga a revisar todo lo que enumera estados de pedido.
- Confirmar que OXXO y *bank transfers* MX estén disponibles y activados en la
  cuenta de la dueña.
