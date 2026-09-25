"use server";

import { revalidatePath } from "next/cache";
import { esquemaGenerarPedido } from "@/lib/esquemas/checkout";
import { armarDatosPedido } from "@/server/pedidos/datosPedido";
import { crearPedido } from "@/server/db/mutations/pedidos";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import type { OrderRow } from "@/types/database";

/** C1: confirma el pedido con la dirección elegida y, si pidió factura,
 * sus datos fiscales. El servidor SIEMPRE recalcula precio y disponible
 * dentro de `crear_pedido()` (RN-10, B1.4) — nunca confía en lo que el
 * carrito mostraba en pantalla. */
export async function generarPedidoAction(datosCrudos: unknown): Promise<ResultadoAction<OrderRow>> {
  return conSesion(async (sesion) => {
    const datos = esquemaGenerarPedido.parse(datosCrudos);

    const { items, shippingAddress, billingData } = await armarDatosPedido(sesion.userId, datos);

    const pedido = await crearPedido({
      userId: sesion.userId,
      items,
      shippingAddress,
      billingData,
      wantsInvoice: datos.wantsInvoice,
      notes: datos.notes,
      idempotencyKey: datos.idempotencyKey,
      creditToApply: datos.creditToApply,
    });

    revalidatePath("/carrito");
    revalidatePath("/mi-cuenta/pedidos");
    return pedido;
  });
}
