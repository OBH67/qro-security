import "server-only";
import type Stripe from "stripe";
import { stripeClient } from "./cliente";

/**
 * `PasarelaStripe` (arquitectura-pagos-stripe.md §2): adaptador común que
 * envuelve el SDK de Stripe — crear/cancelar/consultar PaymentIntent,
 * Customer, idempotency. Las estrategias (tarjeta/oxxo/spei) lo usan por
 * composición; ninguna llama al SDK de Stripe directo.
 *
 * Un solo PaymentIntent por pedido en pago (P2.3, §1): siempre se manda
 * `payment_method_types` explícito por método (nunca "automático"), para
 * que el Payment Element del checkout solo ofrezca el método que el
 * cliente ya eligió en el selector.
 */

const MONEDA = "mxn";

export async function crearPaymentIntentTarjeta(params: {
  amountCents: number;
  orderId: string;
  idempotencyKey: string;
}): Promise<Stripe.PaymentIntent> {
  return stripeClient.paymentIntents.create(
    {
      amount: params.amountCents,
      currency: MONEDA,
      payment_method_types: ["card"],
      metadata: { order_id: params.orderId },
    },
    { idempotencyKey: params.idempotencyKey },
  );
}

/** 0032: cobro con tarjeta del checkout, antes de que exista el pedido.
 * `metadata.payment_id` enlaza el cobro con su fila de `payments` (la usa
 * el webhook para crear el pedido si el navegador se cierra). */
export async function crearPaymentIntentCheckoutTarjeta(params: {
  amountCents: number;
  paymentId: string;
  userId: string;
  idempotencyKey: string;
}): Promise<Stripe.PaymentIntent> {
  return stripeClient.paymentIntents.create(
    {
      amount: params.amountCents,
      currency: MONEDA,
      // "link": la dueña decidió conservar Link de Stripe (25-sep); sin él,
      // confirmar con Link fallaría porque el cobro solo aceptaría "card".
      payment_method_types: ["card", "link"],
      metadata: { payment_id: params.paymentId, user_id: params.userId },
    },
    { idempotencyKey: `checkout-tarjeta-${params.idempotencyKey}` },
  );
}

export async function crearPaymentIntentOxxo(params: {
  amountCents: number;
  orderId: string;
  idempotencyKey: string;
  expiresAfterDays: number;
}): Promise<Stripe.PaymentIntent> {
  return stripeClient.paymentIntents.create(
    {
      amount: params.amountCents,
      currency: MONEDA,
      payment_method_types: ["oxxo"],
      payment_method_options: {
        oxxo: { expires_after_days: params.expiresAfterDays },
      },
      metadata: { order_id: params.orderId },
    },
    { idempotencyKey: params.idempotencyKey },
  );
}

/** SPEI vía Stripe requiere un Stripe Customer (customer_balance +
 * bank_transfer.type = 'mx_bank_transfer', arquitectura §2/§6) —
 * `customerId` lo resuelve `obtenerOCrearStripeCustomerId()`
 * (`db/mutations/pagos.ts`) antes de llamar aquí. */
export async function crearPaymentIntentSpei(params: {
  amountCents: number;
  orderId: string;
  idempotencyKey: string;
  customerId: string;
}): Promise<Stripe.PaymentIntent> {
  return stripeClient.paymentIntents.create(
    {
      amount: params.amountCents,
      currency: MONEDA,
      customer: params.customerId,
      payment_method_types: ["customer_balance"],
      payment_method_options: {
        customer_balance: {
          funding_type: "bank_transfer",
          bank_transfer: { type: "mx_bank_transfer" },
        },
      },
      metadata: { order_id: params.orderId },
    },
    { idempotencyKey: params.idempotencyKey },
  );
}

export async function cancelarPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripeClient.paymentIntents.cancel(paymentIntentId);
}

export async function obtenerPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
  return stripeClient.paymentIntents.retrieve(paymentIntentId);
}

export async function obtenerMetodoPago(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
  return stripeClient.paymentMethods.retrieve(paymentMethodId);
}

export async function crearClienteStripe(params: { email: string; nombre: string }): Promise<string> {
  const cliente = await stripeClient.customers.create({ email: params.email, name: params.nombre });
  return cliente.id;
}

/** P6.1: "enlace al pago en el Stripe Dashboard" desde la bandeja de
 * revisión del admin. Sin `/test/` en la ruta: el Dashboard resuelve el
 * modo (prueba/producción) según la sesión de quien lo abre. */
export function urlDashboardStripe(paymentIntentId: string): string {
  return `https://dashboard.stripe.com/payments/${paymentIntentId}`;
}
