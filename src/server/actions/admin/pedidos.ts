"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import * as mutations from "@/server/db/mutations/admin/pedidos";
import type { OrderRow } from "@/types/database";

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

export async function cancelarPedidoAction(orderId: string, folio: string, motivo?: string): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    const pedido = await mutations.cancelarPedido({ orderId, changedBy: sesion.userId, motivo });
    revalidarPedido(folio);
    return pedido;
  });
}

export async function marcarEnviadoAction(orderId: string, folio: string, costoEnvio: number): Promise<ResultadoAction<OrderRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!Number.isFinite(costoEnvio) || costoEnvio < 0) throw new Error("Escribe un costo de envío válido.");
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
