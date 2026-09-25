import "server-only";
import Stripe from "stripe";
import { stripeClient } from "./cliente";
import { obtenerMetodoPago, extraerInstrucciones } from "./pasarela";
import { env } from "@/server/config/env";
import { registrarPagoStripe } from "@/server/db/mutations/pagos";
import { finalizarPagoTarjeta, finalizarFichaDiferida, PagoNoCompletadoError, PedidoNoRegistradoError } from "@/server/pagos/checkoutTarjeta";
import type { EstadoPago } from "@/types/database";

/** El Route Handler (`src/app/api/webhooks/stripe/route.ts`) distingue
 * "firma inválida" (400, P5.1) de cualquier otro error (500, para que
 * Stripe reintente) solo por el tipo de esta excepción — nunca inspecciona
 * el SDK de Stripe directo (esa dependencia se queda aquí). */
export class FirmaWebhookInvalidaError extends Error {}

/** arquitectura-pagos-stripe.md §5: los únicos seis eventos que nos
 * interesan (Payment Element + PaymentIntents, NO
 * `checkout.session.async_payment_*` — esos son solo de Checkout
 * Sessions). Cualquier otro evento que Stripe llegara a mandar se ignora
 * sin error, para que no se siga reintentando. */
const ESTADO_POR_EVENTO: Partial<Record<Stripe.Event.Type, EstadoPago>> = {
  "payment_intent.succeeded": "pagado",
  "payment_intent.processing": "procesando",
  "payment_intent.requires_action": "requiere_accion",
  "payment_intent.payment_failed": "fallido",
  "payment_intent.canceled": "cancelado",
  "payment_intent.partially_funded": "revision",
};

/** Marca/últimos 4 (P6.1) — solo se consultan cuando hace falta (pago
 * confirmado o en curso): una llamada extra a Stripe por evento, tolerable
 * en un webhook. `payment_method` viaja como id sin expandir en el evento. */
async function extraerTarjeta(paymentIntent: Stripe.PaymentIntent): Promise<{ marca: string | null; ultimos4: string | null }> {
  if (typeof paymentIntent.payment_method !== "string") return { marca: null, ultimos4: null };
  try {
    const metodo = await obtenerMetodoPago(paymentIntent.payment_method);
    return { marca: metodo.card?.brand ?? null, ultimos4: metodo.card?.last4 ?? null };
  } catch {
    // No bloquea el registro del pago por no poder anotar la marca.
    return { marca: null, ultimos4: null };
  }
}

/** P5.1/P5.2: verifica la firma con el cuerpo CRUDO (nunca `request.json()`,
 * que ya lo habría parseado y roto la verificación) y traduce el evento a
 * `registrar_pago_stripe()` (0029), que es quien de verdad decide el
 * efecto (idempotencia, RN-11, §4.1, §4.3 — toda la lógica de negocio
 * vive en SQL, esta función solo hace de traductor Stripe → RPC). */
export async function procesarWebhookStripe(cuerpoCrudo: string, firma: string): Promise<void> {
  let evento: Stripe.Event;
  try {
    evento = await stripeClient.webhooks.constructEventAsync(cuerpoCrudo, firma, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "Firma de webhook inválida.";
    throw new FirmaWebhookInvalidaError(mensaje);
  }

  const estado = ESTADO_POR_EVENTO[evento.type];
  if (!estado) return; // Evento fuera de la lista de P5 — se ignora, sin error.

  const paymentIntent = evento.data.object as Stripe.PaymentIntent;
  const instrucciones = extraerInstrucciones(paymentIntent);
  const necesitaRevision = evento.type === "payment_intent.partially_funded";

  let marca: string | null = null;
  let ultimos4: string | null = null;
  if (evento.type === "payment_intent.succeeded" || evento.type === "payment_intent.processing") {
    const tarjeta = await extraerTarjeta(paymentIntent);
    marca = tarjeta.marca;
    ultimos4 = tarjeta.ultimos4;
  }

  const pago = await registrarPagoStripe({
    eventId: evento.id,
    eventType: evento.type,
    payload: evento as unknown as Record<string, unknown>,
    paymentIntentId: paymentIntent.id,
    status: estado,
    amountReceivedCents: paymentIntent.amount_received,
    instructions: instrucciones,
    cardBrand: marca,
    cardLast4: ultimos4,
    needsReview: necesitaRevision,
  });

  console.info("[webhook stripe]", evento.type, paymentIntent.id, "pago:", pago?.id ?? "sin pago asociado");

  // 0032: cobro con tarjeta aceptado cuyo pedido aún no existe (el cliente
  // cerró el navegador antes de que su navegador lo creara). Si el pedido no
  // se puede crear, el pago ya quedó a revisión: no se lanza para que Stripe
  // no reintente sin fin.
  if (evento.type === "payment_intent.succeeded" && pago && pago.method === "tarjeta" && !pago.order_id) {
    try {
      const pedido = await finalizarPagoTarjeta(paymentIntent.id);
      console.info("[webhook stripe] pedido creado desde el webhook", pedido.folio);
    } catch (error) {
      if (!(error instanceof PedidoNoRegistradoError)) throw error;
    }
  }

  // 0033: mismo respaldo para OXXO/SPEI, pero en `requires_action` — es el
  // evento donde Stripe ya generó la ficha (`next_action` con voucher/
  // CLABE), el equivalente exacto a "cobro aceptado" de tarjeta. En
  // `succeeded` el pago real ya llegó pero `next_action` ya viene vacío
  // (el voucher se pagó), así que ya no hay ficha que extraer — si el
  // pedido no se creó en `requires_action`, no hay forma de recuperarlo
  // aquí; por eso importa que este respaldo exista.
  if (
    evento.type === "payment_intent.requires_action" &&
    pago &&
    (pago.method === "oxxo" || pago.method === "spei") &&
    !pago.order_id
  ) {
    try {
      const { pedido } = await finalizarFichaDiferida(paymentIntent.id, pago.method);
      console.info("[webhook stripe] pedido creado desde el webhook", pedido.folio);
    } catch (error) {
      if (!(error instanceof PedidoNoRegistradoError) && !(error instanceof PagoNoCompletadoError)) throw error;
    }
  }
}
