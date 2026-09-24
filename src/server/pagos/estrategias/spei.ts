import "server-only";
import type { EstrategiaPago, PedidoParaPago, CtxPago, InicioPago, DetallePagoRevision, EstadoProveedor } from "../tipos";
import type { InstruccionesPago } from "@/types/database";
import { iniciarPagoStripe, guardarPaymentIntent, obtenerOCrearStripeCustomerId } from "@/server/db/mutations/pagos";
import { crearPaymentIntentSpei, obtenerPaymentIntent } from "../stripe/pasarela";
import { obtenerDetalleRevisionPago, obtenerInstruccionesPago, obtenerDiasVigenciaPago } from "@/server/db/queries/pagos";

export const estrategiaSpei: EstrategiaPago = {
  metodo: "spei",

  async vigenciaApartado(): Promise<number> {
    const dias = await obtenerDiasVigenciaPago("spei_expires_days");
    return dias * 24 * 60;
  },

  async iniciar(pedido: PedidoParaPago, ctx: CtxPago): Promise<InicioPago> {
    const dias = await obtenerDiasVigenciaPago("spei_expires_days");
    const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60_000).toISOString();

    const pago = await iniciarPagoStripe({
      orderId: pedido.id,
      method: "spei",
      amountCents: pedido.totalCents,
      expiresAt,
      idempotencyKey: ctx.idempotencyKey,
      changedBy: pedido.userId,
    });

    if (pago.stripe_payment_intent_id) {
      const existente = await obtenerPaymentIntent(pago.stripe_payment_intent_id);
      return { tipo: "payment_element", clientSecret: existente.client_secret ?? "", paymentIntentId: existente.id };
    }

    // customer_balance (SPEI) exige un Stripe Customer (arquitectura §6).
    const customerId = await obtenerOCrearStripeCustomerId({
      userId: pedido.userId,
      email: pedido.userEmail,
      nombre: pedido.userNombre,
    });

    const paymentIntent = await crearPaymentIntentSpei({
      amountCents: pedido.totalCents,
      orderId: pedido.id,
      idempotencyKey: ctx.idempotencyKey,
      customerId,
    });
    await guardarPaymentIntent(pago.id, paymentIntent.id);

    return { tipo: "payment_element", clientSecret: paymentIntent.client_secret ?? "", paymentIntentId: paymentIntent.id };
  },

  async instrucciones(pedidoId: string): Promise<InstruccionesPago | null> {
    return obtenerInstruccionesPago(pedidoId, "spei");
  },

  async detalleRevision(pedidoId: string): Promise<DetallePagoRevision | null> {
    return obtenerDetalleRevisionPago(pedidoId, "spei");
  },

  async verificarEnProveedor(pedidoId: string): Promise<EstadoProveedor | null> {
    const detalle = await obtenerDetalleRevisionPago(pedidoId, "spei");
    if (!detalle?.paymentIntentId) return null;
    const paymentIntent = await obtenerPaymentIntent(detalle.paymentIntentId);
    return { status: paymentIntent.status, raw: paymentIntent };
  },
};
