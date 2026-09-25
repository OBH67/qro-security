"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import { crearClienteServidor } from "@/server/supabase/server";
import { obtenerEstrategia } from "@/server/pagos/registro";
import type { InicioPago, MetodoPago } from "@/server/pagos/tipos";
import { esquemaGenerarPedido } from "@/lib/esquemas/checkout";
import { armarDatosPedido } from "@/server/pedidos/datosPedido";
import { obtenerSaldoDisponible } from "@/server/db/queries/saldo";
import { prepararPagoTarjeta, guardarPaymentIntent } from "@/server/db/mutations/pagos";
import { crearPaymentIntentCheckoutTarjeta, obtenerPaymentIntent } from "@/server/pagos/stripe/pasarela";
import { finalizarPagoTarjeta, PagoNoCompletadoError, PedidoNoRegistradoError } from "@/server/pagos/checkoutTarjeta";

const esquemaIniciarPago = z.object({
  orderId: z.uuid(),
  metodo: z.enum(["tarjeta", "oxxo", "spei"]),
  idempotencyKey: z.uuid("Falta la llave de idempotencia del intento de pago."),
});

/**
 * P1-P4: el cliente ya eligió método en el selector del checkout; esta
 * acción arranca el intento (aparta inventario hacia `pago_en_proceso` +
 * crea el PaymentIntent) reutilizando la estrategia correspondiente
 * (P10). El comprobante NO pasa por aquí — su flujo (subir archivo) sigue
 * siendo `solicitarSubidaComprobanteAction`/`confirmarComprobanteAction`
 * (P1.2: "el comprobante conserva exactamente el flujo actual").
 */
export async function iniciarPagoStripeAction(datosCrudos: unknown): Promise<ResultadoAction<InicioPago>> {
  return conSesion(async (sesion) => {
    const datos = esquemaIniciarPago.parse(datosCrudos);

    const supabase = await crearClienteServidor();
    const { data: pedido, error } = await supabase
      .from("orders")
      .select("id, folio, user_id, total, status")
      .eq("id", datos.orderId)
      .eq("user_id", sesion.userId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cargar el pedido: ${error.message}`);
    if (!pedido) throw new Error("Pedido no encontrado.");
    if (pedido.status !== "pendiente_pago") {
      throw new Error("Este pedido ya no está pendiente de pago.");
    }

    const estrategia = obtenerEstrategia(datos.metodo as MetodoPago);
    const resultado = await estrategia.iniciar(
      {
        id: pedido.id,
        folio: pedido.folio,
        userId: pedido.user_id,
        userEmail: sesion.email,
        userNombre: `${sesion.perfil.first_name} ${sesion.perfil.last_name}`.trim(),
        totalCents: Math.round(Number(pedido.total) * 100),
      },
      { idempotencyKey: datos.idempotencyKey },
    );

    revalidatePath(`/mi-cuenta/pedidos/${pedido.folio}`);
    return resultado;
  });
}

export interface CobroTarjetaPreparado {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
}

/**
 * Tarjeta, paso 1 (0032): valida carrito, dirección y existencias, y crea
 * el cobro en Stripe. NO crea pedido ni vacía el carrito — eso ocurre solo
 * cuando Stripe acepta el pago (`finalizarPedidoTarjetaAction`). Una llave
 * nueva por cada clic en "Pagar"; repetir la misma llave regresa el mismo
 * cobro (doble clic, reintento de red).
 */
export async function prepararPagoTarjetaAction(datosCrudos: unknown): Promise<ResultadoAction<CobroTarjetaPreparado>> {
  return conSesion(async (sesion) => {
    const datos = esquemaGenerarPedido.parse(datosCrudos);
    const { items, subtotal, shippingAddress, billingData } = await armarDatosPedido(sesion.userId, datos);

    const saldo = datos.creditToApply > 0 ? await obtenerSaldoDisponible(sesion.userId) : 0;
    const credito = Math.max(0, Math.min(datos.creditToApply, saldo, subtotal));
    const amountCents = Math.round((subtotal - credito) * 100);
    if (amountCents <= 0) {
      throw new Error("Tu saldo a favor cubre todo el pedido; no hace falta pagar con tarjeta.");
    }

    const pago = await prepararPagoTarjeta({
      userId: sesion.userId,
      checkout: {
        items: items.map((i) => ({ product_id: i.productId, qty: i.qty })),
        shipping_address: shippingAddress,
        billing_data: billingData,
        wants_invoice: datos.wantsInvoice,
        credit_to_apply: credito,
        notes: datos.notes ?? null,
      },
      amountCents,
      idempotencyKey: datos.idempotencyKey,
    });

    let paymentIntentId = pago.stripe_payment_intent_id;
    let clientSecret: string | null = null;
    if (paymentIntentId) {
      clientSecret = (await obtenerPaymentIntent(paymentIntentId)).client_secret;
    } else {
      const paymentIntent = await crearPaymentIntentCheckoutTarjeta({
        amountCents: pago.amount_cents,
        paymentId: pago.id,
        userId: sesion.userId,
        idempotencyKey: datos.idempotencyKey,
      });
      await guardarPaymentIntent(pago.id, paymentIntent.id);
      paymentIntentId = paymentIntent.id;
      clientSecret = paymentIntent.client_secret;
    }
    if (!clientSecret) throw new Error(`Stripe no regresó client_secret para ${paymentIntentId}.`);

    return { clientSecret, paymentIntentId, amountCents: pago.amount_cents };
  });
}

/**
 * Tarjeta, paso 2 (0032): el navegador avisa que Stripe aceptó el pago. El
 * servidor lo confirma directo con Stripe (nunca confía en el navegador) y
 * crea el pedido. Sin `revalidatePath`: refrescar /pagar con el carrito ya
 * vacío redirigía a /carrito a medio pago (error 3 del 25-sep).
 */
export async function finalizarPedidoTarjetaAction(paymentIntentId: unknown): Promise<ResultadoAction<{ folio: string }>> {
  return conSesion(async (sesion) => {
    const id = z.string().startsWith("pi_").parse(paymentIntentId);
    try {
      const pedido = await finalizarPagoTarjeta(id, sesion.userId);
      return { folio: pedido.folio };
    } catch (error) {
      if (error instanceof PagoNoCompletadoError) {
        throw new Error("Tu pago no se completó y no se hizo ningún cargo. Revisa tu tarjeta o intenta con otra.");
      }
      if (error instanceof PedidoNoRegistradoError) {
        throw new Error(
          `Recibimos tu pago, pero no pudimos registrar tu pedido (${error.message}). Tu pago quedó guardado con la referencia ${id}; escríbenos con esa referencia y lo resolvemos con saldo a favor.`,
        );
      }
      throw error;
    }
  });
}
