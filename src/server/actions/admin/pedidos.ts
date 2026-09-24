"use server";

import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import * as mutations from "@/server/db/mutations/admin/pedidos";
import { obtenerEstrategia } from "@/server/pagos/registro";
import type { MetodoPagoStripe, OrderRow } from "@/types/database";
import { traducirEstadoStripeCrudo } from "@/lib/pagos/estadoAdmin";

/** C5.3-C5.6: solo `admin` — Pedidos no es parte del alcance de
 * `inventario` (H5.1). */

function revalidarPedido(folio: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${folio}`);
}

export async function validarPagoAction(orderId: string, folio: string): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    const pedido = await mutations.validarPago({ orderId, changedBy: sesion.userId });
    revalidarPedido(folio);
    return pedido;
  });
}

export async function rechazarComprobanteAction(orderId: string, folio: string, motivo: string): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!motivo.trim()) throw new Error("Escribe el motivo del rechazo — el cliente lo verá.");
    const pedido = await mutations.rechazarComprobante({ orderId, changedBy: sesion.userId, motivo });
    revalidarPedido(folio);
    return pedido;
  });
}

/** RN-16: "Rechazar pago" de un pedido pagado con Stripe (§6.2) y las dos
 * acciones "Abonar $X como saldo..." de los casos de revisión especiales
 * (§6.3, monto distinto de SPEI / pagado sin inventario) — las tres
 * comparten la misma operación de servidor (`rechazarPagoStripe()`), el
 * motivo siempre queda en la bitácora del pedido. */
export async function rechazarPagoStripeAction(orderId: string, folio: string, motivo: string): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!motivo.trim()) throw new Error("Escribe el motivo — queda en la bitácora del pedido.");
    const pedido = await mutations.rechazarPagoStripe({ orderId, changedBy: sesion.userId, motivo });
    revalidarPedido(folio);
    return pedido;
  });
}

export interface ConsultaEstadoStripe {
  /** Traducido, nunca el valor técnico crudo (§6.5) — solo se usa para
   * comparar contra el badge ya mostrado y decidir si hay que avisar. */
  estadoTraducido: string;
  coincide: boolean;
  /** §6.2 "SOLO AQUÍ (nunca al cliente)": el decline code y el mensaje de
   * Stripe cuando el intento más reciente falló. */
  declineCode: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  consultadoEn: string;
}

/** P6.2: "Consultar estado en Stripe" — lee `PaymentIntent.status` en vivo
 * desde el servidor (nunca desde el navegador, RN-12) vía
 * `EstrategiaPago.verificarEnProveedor()`, que ya existe para esto
 * (arquitectura-pagos-stripe.md §2). No escribe nada en `payments`: el
 * webhook sigue siendo la única fuente de verdad que persiste el estado;
 * esta consulta solo refresca lo que ve el admin en su pantalla. */
export async function consultarEstadoPagoStripeAction(
  orderId: string,
  metodo: MetodoPagoStripe,
  estadoGuardadoTraducido: string,
): Promise<ResultadoAction<ConsultaEstadoStripe>> {
  return conSesionStaff(["admin"], async () => {
    const estrategia = obtenerEstrategia(metodo);
    if (!estrategia.verificarEnProveedor) throw new Error("Este método no admite consultar su estado directo en Stripe.");

    const resultado = await estrategia.verificarEnProveedor(orderId);
    if (!resultado) throw new Error("No hay un intento de pago de Stripe registrado para este pedido.");

    const paymentIntent = resultado.raw as Stripe.PaymentIntent;
    const ultimoError = paymentIntent.last_payment_error ?? null;
    const estadoTraducido = traducirEstadoStripeCrudo(resultado.status);

    return {
      estadoTraducido,
      coincide: estadoTraducido === estadoGuardadoTraducido,
      declineCode: ultimoError?.decline_code ?? null,
      failureCode: ultimoError?.code ?? null,
      failureMessage: ultimoError?.message ?? null,
      consultadoEn: new Date().toISOString(),
    };
  });
}

export async function cancelarPedidoAction(orderId: string, folio: string, motivo?: string): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    const pedido = await mutations.cancelarPedido({ orderId, changedBy: sesion.userId, motivo });
    revalidarPedido(folio);
    return pedido;
  });
}

export async function marcarEnviadoAction(orderId: string, folio: string, costoEnvio: number | null): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (costoEnvio !== null && (!Number.isFinite(costoEnvio) || costoEnvio < 0)) throw new Error("Escribe un costo de envío válido.");
    const pedido = await mutations.marcarEnviado({ orderId, changedBy: sesion.userId, costoEnvio });
    revalidarPedido(folio);
    return pedido;
  });
}

export async function marcarEntregadoAction(orderId: string, folio: string): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    const pedido = await mutations.marcarEntregado({ orderId, changedBy: sesion.userId });
    revalidarPedido(folio);
    return pedido;
  });
}
