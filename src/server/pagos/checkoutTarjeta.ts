import "server-only";
import { obtenerMetodoPago, obtenerPaymentIntent } from "./stripe/pasarela";
import { crearPedidoDesdePago, obtenerPagoPorId } from "@/server/db/mutations/pagos";
import type { OrderRow } from "@/types/database";

export class PagoNoCompletadoError extends Error {}
export class PedidoNoRegistradoError extends Error {}

/**
 * Cierra un cobro con tarjeta del checkout (0032): con el pago YA aceptado
 * por Stripe, crea el pedido. Nunca confía en lo que dice el navegador: el
 * estado se lee de Stripe con la llave secreta. Idempotente — la llaman el
 * navegador, la página de regreso de 3D Secure y el webhook; el primero que
 * llega crea el pedido, los demás reciben el mismo.
 */
export async function finalizarPagoTarjeta(paymentIntentId: string, userIdEsperado?: string): Promise<OrderRow> {
  const paymentIntent = await obtenerPaymentIntent(paymentIntentId);
  const paymentId = paymentIntent.metadata?.payment_id;
  if (!paymentId) {
    throw new Error(`El PaymentIntent ${paymentIntentId} no pertenece a un cobro del checkout.`);
  }

  const pago = await obtenerPagoPorId(paymentId);
  if (!pago) throw new Error(`No existe el pago ${paymentId} del PaymentIntent ${paymentIntentId}.`);
  if (userIdEsperado && pago.user_id !== userIdEsperado) {
    throw new Error("Este pago no pertenece a tu cuenta.");
  }
  if (pago.stripe_payment_intent_id !== paymentIntent.id) {
    throw new Error(`El pago ${paymentId} no corresponde al PaymentIntent ${paymentIntentId}.`);
  }

  if (paymentIntent.status !== "succeeded") {
    throw new PagoNoCompletadoError(`Stripe reporta el pago como "${paymentIntent.status}".`);
  }

  let cardBrand: string | null = null;
  let cardLast4: string | null = null;
  if (typeof paymentIntent.payment_method === "string") {
    try {
      const metodo = await obtenerMetodoPago(paymentIntent.payment_method);
      cardBrand = metodo.card?.brand ?? null;
      cardLast4 = metodo.card?.last4 ?? null;
    } catch (error) {
      console.error("[pago tarjeta] no se pudo leer la tarjeta de", paymentIntentId, error);
    }
  }

  const pedido = await crearPedidoDesdePago({ paymentId, cardBrand, cardLast4 });
  if (!pedido) {
    const actualizado = await obtenerPagoPorId(paymentId);
    console.error("[pago tarjeta] cobro aceptado SIN pedido, queda a revisión", {
      paymentId,
      paymentIntentId,
      motivo: actualizado?.ultimo_error,
    });
    throw new PedidoNoRegistradoError(actualizado?.ultimo_error ?? "No se pudo registrar el pedido.");
  }
  return pedido;
}
