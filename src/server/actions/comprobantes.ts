"use server";

import { revalidatePath } from "next/cache";
import { esquemaComprobante } from "@/lib/esquemas/checkout";
import { crearClienteServidor } from "@/server/supabase/server";
import { pedidoListoParaComprobante, prepararSubidaComprobante, confirmarComprobante } from "@/server/db/mutations/comprobantes";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import type { OrderRow } from "@/types/database";

/** C2: paso 1 de la subida — el servidor autentica, autoriza (¿el pedido
 * es tuyo y sigue pendiente?), valida el tipo declarado y genera la clave
 * + URL firmada (arquitectura §7.1). El archivo NO pasa por este
 * servidor: el navegador hace `PUT` directo a R2 con la URL que regresa
 * esta acción. */
export async function solicitarSubidaComprobanteAction(params: {
  orderId: string;
  folio: string;
  nombreArchivo: string;
  contentType: string;
}): Promise<ResultadoAction<{ key: string; url: string; tamanoMaximoBytes: number }>> {
  return conSesion(async (sesion) => {
    const listo = await pedidoListoParaComprobante(sesion.userId, params.orderId);
    if (!listo) throw new Error("Este pedido no está pendiente de comprobante.");

    const extension = params.nombreArchivo.includes(".") ? params.nombreArchivo.split(".").pop()! : "bin";
    return prepararSubidaComprobante({ folio: params.folio, extension, contentType: params.contentType });
  });
}

/** C2: paso 2 — tras el `PUT` exitoso a R2, confirma tamaño/tipo real
 * (C2.2) y aparta el inventario (§9.1) dentro de una sola transacción. */
export async function confirmarComprobanteAction(
  orderId: string,
  key: string,
  datosCrudos: unknown,
): Promise<ResultadoAction<OrderRow>> {
  return conSesion(async (sesion) => {
    const datos = esquemaComprobante.parse({ ...(datosCrudos as object), orderId });
    const listo = await pedidoListoParaComprobante(sesion.userId, orderId);
    if (!listo) throw new Error("Este pedido ya no está pendiente de comprobante.");

    const pedido = await confirmarComprobante({ userId: sesion.userId, orderId, key, datos });
    revalidatePath("/mi-cuenta/pedidos");
    revalidatePath(`/mi-cuenta/pedidos/${pedido.folio}`);
    return pedido;
  });
}

/** Verifica dueño + trae folio/total para la pantalla de subida sin
 * duplicar la consulta de `queries/pedidos.ts` (usa el cliente con
 * sesión: RLS ya limita a "solo lo propio"). */
export async function obtenerPedidoParaComprobanteAction(
  orderId: string,
): Promise<ResultadoAction<{ folio: string; total: string; status: string }>> {
  return conSesion(async (sesion) => {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("orders")
      .select("folio, total, status")
      .eq("id", orderId)
      .eq("user_id", sesion.userId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cargar el pedido: ${error.message}`);
    if (!data) throw new Error("Pedido no encontrado.");
    return data;
  });
}
