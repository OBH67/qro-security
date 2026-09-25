import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { despacharPendientes } from "@/server/notifications/despachador";
import { crearClienteStripe } from "@/server/pagos/stripe/pasarela";
import type { CheckoutTarjeta, EstadoPago, InstruccionesPago, MetodoPagoStripe, OrderRow, PaymentRow } from "@/types/database";

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

/** P2-P4 + RN-13/RN-15: aparta el pedido (vía `apartar_pedido()`, mismo
 * candado que el flujo de comprobante) hacia `pago_en_proceso` y crea la
 * fila de `payments` — antes de tocar la API de Stripe. Idempotente por
 * (order_id, idempotency_key): un reintento regresa el mismo intento. */
export async function iniciarPagoStripe(params: {
  orderId: string;
  method: MetodoPagoStripe;
  amountCents: number;
  expiresAt: string;
  idempotencyKey: string;
  changedBy: string;
}): Promise<PaymentRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("iniciar_pago_stripe", {
    p_order_id: params.orderId,
    p_method: params.method,
    p_amount_cents: params.amountCents,
    p_expires_at: params.expiresAt,
    p_idempotency_key: params.idempotencyKey,
    p_changed_by: params.changedBy,
  });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as PaymentRow;
}

/** Tras crear el PaymentIntent en Stripe (llamada de red, fuera de la
 * transacción SQL), se guarda su id en la fila ya creada por
 * `iniciarPagoStripe()`. Escritura directa (no RPC): no hay lógica de
 * negocio que proteger aquí, solo persistir un dato — mismo criterio que
 * `mutations/admin/pedidos.ts` con lecturas/escrituras simples. */
export async function guardarPaymentIntent(paymentId: string, stripePaymentIntentId: string): Promise<void> {
  const admin = crearClienteAdmin();
  const { error } = await admin.from("payments").update({ stripe_payment_intent_id: stripePaymentIntentId }).eq("id", paymentId);
  if (error) throw new Error(`No se pudo guardar el intento de pago: ${error.message}`);
}

/** SPEI (customer_balance) exige un Stripe Customer (arquitectura §6) —
 * se crea solo la primera vez que un cliente paga con SPEI y se guarda en
 * `profiles.stripe_customer_id` para reutilizarse siempre. */
export async function obtenerOCrearStripeCustomerId(params: { userId: string; email: string; nombre: string }): Promise<string> {
  const admin = crearClienteAdmin();
  const { data: perfil, error } = await admin.from("profiles").select("stripe_customer_id").eq("id", params.userId).maybeSingle();
  if (error) throw new Error(`No se pudo leer el perfil: ${error.message}`);
  if (perfil?.stripe_customer_id) return perfil.stripe_customer_id;

  const stripeCustomerId = await crearClienteStripe({ email: params.email, nombre: params.nombre });

  const { error: errorGuardar } = await admin.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", params.userId);
  if (errorGuardar) throw new Error(`No se pudo guardar el cliente de Stripe: ${errorGuardar.message}`);

  return stripeCustomerId;
}

/** P5: traduce un evento de webhook ya verificado a un cambio de estado
 * (idempotente vía `stripe_webhook_events`, RN-11: nunca avanza directo a
 * "Listo para envío" — ver `registrar_pago_stripe()`, 0029). */
export async function registrarPagoStripe(params: {
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  paymentIntentId: string;
  status: EstadoPago;
  amountReceivedCents?: number | null;
  instructions?: InstruccionesPago | null;
  cardBrand?: string | null;
  cardLast4?: string | null;
  needsReview?: boolean;
}): Promise<PaymentRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("registrar_pago_stripe", {
    p_event_id: params.eventId,
    p_event_type: params.eventType,
    p_payload: params.payload,
    p_payment_intent_id: params.paymentIntentId,
    p_status: params.status,
    p_amount_received_cents: params.amountReceivedCents ?? null,
    p_instructions: params.instructions ?? null,
    p_card_brand: params.cardBrand ?? null,
    p_card_last4: params.cardLast4 ?? null,
    p_needs_review: params.needsReview ?? false,
  });
  if (error) throw new Error(traducirError(error.message));

  // Mismo criterio que el resto de mutations (C3.2): el envío real de
  // notificaciones ocurre después del commit, nunca dentro de él.
  await despacharPendientes();

  return (data as unknown as PaymentRow | null) ?? null;
}

/** 0032/0033: cobro SIN pedido todavía, para los 3 métodos de Stripe
 * (decisión de la dueña: el pedido solo existe si Stripe aceptó el pago —
 * con tarjeta, "aceptado" es el cargo; con OXXO/SPEI, es que la ficha se
 * generó). Valida existencias y guarda la foto del checkout; idempotente
 * por (cliente, llave). */
export async function prepararPagoStripe(params: {
  userId: string;
  method: MetodoPagoStripe;
  checkout: CheckoutTarjeta;
  amountCents: number;
  idempotencyKey: string;
}): Promise<PaymentRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("preparar_pago_stripe", {
    p_user_id: params.userId,
    p_method: params.method,
    p_checkout: params.checkout,
    p_amount_cents: params.amountCents,
    p_idempotency_key: params.idempotencyKey,
  });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as PaymentRow;
}

/** 0032/0033: crea el pedido de un cobro ya aceptado (o regresa el que ya
 * existe). Tarjeta: nace en la cola de revisión (ya se cobró de verdad).
 * OXXO/SPEI: nace en `pago_en_proceso` (la ficha ya existe; el pago real
 * llega después por webhook) — requieren `instructions`. `null` = el cobro
 * ocurrió pero no se pudo crear el pedido; queda a revisión con el motivo
 * en `ultimo_error`. */
export async function crearPedidoDesdePago(params: {
  paymentId: string;
  cardBrand?: string | null;
  cardLast4?: string | null;
  instructions?: InstruccionesPago | null;
  expiresAt?: string | null;
}): Promise<OrderRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("crear_pedido_desde_pago", {
    p_payment_id: params.paymentId,
    p_card_brand: params.cardBrand ?? null,
    p_card_last4: params.cardLast4 ?? null,
    p_instructions: params.instructions ?? null,
    p_expires_at: params.expiresAt ?? null,
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  const pedido = data as unknown as OrderRow | null;
  return pedido?.id ? pedido : null;
}

export async function obtenerPagoPorId(paymentId: string): Promise<PaymentRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.from("payments").select("*").eq("id", paymentId).maybeSingle();
  if (error) throw new Error(`No se pudo leer el pago: ${error.message}`);
  return data as PaymentRow | null;
}
