import "server-only";
import type { EstrategiaPago, PedidoParaPago, CtxPago, InicioPago, DetallePagoRevision, EstadoProveedor } from "../tipos";
import { iniciarPagoStripe, guardarPaymentIntent } from "@/server/db/mutations/pagos";
import { crearPaymentIntentTarjeta, obtenerPaymentIntent } from "../stripe/pasarela";
import { obtenerDetalleRevisionPago } from "@/server/db/queries/pagos";

/** RN-14 (decisión de la dueña, 2026-09-24): 30 minutos de vigencia de
 * apartado para tarjeta. El cron que hace cumplir este límite (liberar el
 * apartado y cancelar el PaymentIntent en Stripe cuando vence) queda
 * pendiente como el siguiente incremento — ver nota en el resumen final. */
const VIGENCIA_MINUTOS_TARJETA = 30;

export const estrategiaTarjeta: EstrategiaPago = {
  metodo: "tarjeta",

  async vigenciaApartado(): Promise<number> {
    return VIGENCIA_MINUTOS_TARJETA;
  },

  async iniciar(pedido: PedidoParaPago, ctx: CtxPago): Promise<InicioPago> {
    const expiresAt = new Date(Date.now() + VIGENCIA_MINUTOS_TARJETA * 60_000).toISOString();

    const pago = await iniciarPagoStripe({
      orderId: pedido.id,
      method: "tarjeta",
      amountCents: pedido.totalCents,
      expiresAt,
      idempotencyKey: ctx.idempotencyKey,
      changedBy: pedido.userId,
    });

    if (pago.stripe_payment_intent_id) {
      // Reintento con la misma llave (P2.3): ya existe un PaymentIntent
      // para este intento, se reutiliza en vez de crear uno nuevo.
      const existente = await obtenerPaymentIntent(pago.stripe_payment_intent_id);
      return { tipo: "payment_element", clientSecret: existente.client_secret ?? "", paymentIntentId: existente.id };
    }

    const paymentIntent = await crearPaymentIntentTarjeta({
      amountCents: pedido.totalCents,
      orderId: pedido.id,
      idempotencyKey: ctx.idempotencyKey,
    });
    await guardarPaymentIntent(pago.id, paymentIntent.id);

    return { tipo: "payment_element", clientSecret: paymentIntent.client_secret ?? "", paymentIntentId: paymentIntent.id };
  },

  async detalleRevision(pedidoId: string): Promise<DetallePagoRevision | null> {
    return obtenerDetalleRevisionPago(pedidoId, "tarjeta");
  },

  async verificarEnProveedor(pedidoId: string): Promise<EstadoProveedor | null> {
    const detalle = await obtenerDetalleRevisionPago(pedidoId, "tarjeta");
    if (!detalle?.paymentIntentId) return null;
    const paymentIntent = await obtenerPaymentIntent(detalle.paymentIntentId);
    return { status: paymentIntent.status, raw: paymentIntent };
  },
};
