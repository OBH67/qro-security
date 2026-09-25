import "server-only";
import type { EstrategiaPago, PedidoParaPago, CtxPago, InicioPago, DetallePagoRevision, EstadoProveedor } from "../tipos";
import type { InstruccionesPago } from "@/types/database";
import { iniciarPagoStripe, guardarPaymentIntent } from "@/server/db/mutations/pagos";
import { crearPaymentIntentOxxo, obtenerPaymentIntent } from "../stripe/pasarela";
import { obtenerDetalleRevisionPago, obtenerInstruccionesPago, obtenerDiasVigenciaPago } from "@/server/db/queries/pagos";

export const estrategiaOxxo: EstrategiaPago = {
  metodo: "oxxo",

  async vigenciaApartado(): Promise<number> {
    const dias = await obtenerDiasVigenciaPago("oxxo_expires_days");
    return dias * 24 * 60;
  },

  async iniciar(pedido: PedidoParaPago, ctx: CtxPago): Promise<InicioPago> {
    const dias = await obtenerDiasVigenciaPago("oxxo_expires_days");
    const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60_000).toISOString();

    const pago = await iniciarPagoStripe({
      orderId: pedido.id,
      method: "oxxo",
      amountCents: pedido.totalCents,
      expiresAt,
      idempotencyKey: ctx.idempotencyKey,
      changedBy: pedido.userId,
    });

    if (pago.stripe_payment_intent_id) {
      const existente = await obtenerPaymentIntent(pago.stripe_payment_intent_id);
      return { tipo: "payment_element", clientSecret: existente.client_secret ?? "", paymentIntentId: existente.id, expiresAt: pago.expires_at ?? expiresAt };
    }

    const paymentIntent = await crearPaymentIntentOxxo({
      amountCents: pedido.totalCents,
      orderId: pedido.id,
      idempotencyKey: ctx.idempotencyKey,
      expiresAfterDays: dias,
    });
    await guardarPaymentIntent(pago.id, paymentIntent.id);

    return { tipo: "payment_element", clientSecret: paymentIntent.client_secret ?? "", paymentIntentId: paymentIntent.id, expiresAt: pago.expires_at ?? expiresAt };
  },

  async instrucciones(pedidoId: string): Promise<InstruccionesPago | null> {
    return obtenerInstruccionesPago(pedidoId, "oxxo");
  },

  async detalleRevision(pedidoId: string): Promise<DetallePagoRevision | null> {
    return obtenerDetalleRevisionPago(pedidoId, "oxxo");
  },

  async verificarEnProveedor(pedidoId: string): Promise<EstadoProveedor | null> {
    const detalle = await obtenerDetalleRevisionPago(pedidoId, "oxxo");
    if (!detalle?.paymentIntentId) return null;
    const paymentIntent = await obtenerPaymentIntent(detalle.paymentIntentId);
    return { status: paymentIntent.status, raw: paymentIntent };
  },
};
