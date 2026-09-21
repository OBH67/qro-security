"use server";

import { revalidatePath } from "next/cache";
import { esquemaSolicitarDevolucion } from "@/lib/esquemas/devolucion";
import { obtenerPedidosElegiblesParaDevolucion } from "@/server/db/queries/devoluciones";
import {
  solicitarDevolucion,
  devolucionListaParaFoto,
  prepararSubidaFotoDevolucion,
  confirmarFotoDevolucion,
} from "@/server/db/mutations/devoluciones";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import type { ReturnRow } from "@/types/database";

/** D1: valida en el servidor que las partidas elegidas de verdad
 * pertenecen a un pedido elegible del cliente (mismo criterio que C1: el
 * servidor nunca confía en lo que mandó el formulario) antes de llamar a
 * `solicitar_devolucion()`, que vuelve a validar todo dentro de la
 * transacción (defensa en profundidad, no redundancia inútil: aquí se
 * traduce a mensajes de negocio antes de intentar). */
export async function solicitarDevolucionAction(datosCrudos: unknown): Promise<ResultadoAction<ReturnRow>> {
  return conSesion(async (sesion) => {
    const datos = esquemaSolicitarDevolucion.parse(datosCrudos);

    const elegibles = await obtenerPedidosElegiblesParaDevolucion(sesion.userId);
    const pedido = elegibles.find((p) => p.orderId === datos.orderId);
    if (!pedido) throw new Error("Ese pedido no está disponible para devolución.");

    const devolucion = await solicitarDevolucion({
      userId: sesion.userId,
      orderId: datos.orderId,
      reason: datos.reason,
      items: datos.items,
    });

    revalidatePath("/mi-cuenta/devoluciones");
    revalidatePath("/mi-cuenta/pedidos");
    return devolucion;
  });
}

/** D1.3: mismo flujo de 2 pasos que el comprobante — el servidor firma la
 * URL de subida, el navegador hace `PUT` directo a R2. */
export async function solicitarSubidaFotoDevolucionAction(params: {
  returnId: string;
  folio: string;
  nombreArchivo: string;
  contentType: string;
}): Promise<ResultadoAction<{ key: string; url: string; tamanoMaximoBytes: number }>> {
  return conSesion(async (sesion) => {
    const lista = await devolucionListaParaFoto(sesion.userId, params.returnId);
    if (!lista) throw new Error("Esa devolución no está disponible.");

    const extension = params.nombreArchivo.includes(".") ? params.nombreArchivo.split(".").pop()! : "jpg";
    return prepararSubidaFotoDevolucion({ folio: params.folio, extension, contentType: params.contentType });
  });
}

export async function confirmarFotoDevolucionAction(returnId: string, key: string): Promise<ResultadoAction<{ ok: true }>> {
  return conSesion(async (sesion) => {
    const lista = await devolucionListaParaFoto(sesion.userId, returnId);
    if (!lista) throw new Error("Esa devolución no está disponible.");

    await confirmarFotoDevolucion({ returnId, key });
    return { ok: true as const };
  });
}
