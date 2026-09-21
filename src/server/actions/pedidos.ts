"use server";

import { revalidatePath } from "next/cache";
import { esquemaGenerarPedido } from "@/lib/esquemas/checkout";
import { obtenerCarritoResuelto } from "@/server/db/queries/carrito";
import { obtenerDireccionPorId } from "@/server/db/queries/cuenta";
import { crearClienteServidor } from "@/server/supabase/server";
import { crearPedido } from "@/server/db/mutations/pedidos";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import type { DatosFiscalesCongelados, DireccionCongelada, OrderRow } from "@/types/database";

/** C1: confirma el pedido con la dirección elegida y, si pidió factura,
 * sus datos fiscales. El servidor SIEMPRE recalcula precio y disponible
 * dentro de `crear_pedido()` (RN-10, B1.4) — nunca confía en lo que el
 * carrito mostraba en pantalla. */
export async function generarPedidoAction(datosCrudos: unknown): Promise<ResultadoAction<OrderRow>> {
  return conSesion(async (sesion) => {
    const datos = esquemaGenerarPedido.parse(datosCrudos);

    const carrito = await obtenerCarritoResuelto(sesion.userId);
    if (carrito.items.length === 0) {
      throw new Error("Tu pedido está vacío. Agrega productos antes de continuar.");
    }

    const direccion = await obtenerDireccionPorId(datos.addressId);
    if (!direccion || direccion.user_id !== sesion.userId) {
      throw new Error("Elige una dirección de envío válida.");
    }
    const shippingAddress: DireccionCongelada = {
      label: direccion.label,
      street: direccion.street,
      ext_number: direccion.ext_number,
      int_number: direccion.int_number,
      postal_code: direccion.postal_code,
      neighborhood: direccion.neighborhood,
      municipality: direccion.municipality,
      state: direccion.state,
      recipient_name: direccion.recipient_name,
      directions: direccion.directions,
    };

    let billingData: DatosFiscalesCongelados | null = null;
    if (datos.wantsInvoice) {
      if (!datos.billingProfileId) throw new Error("Elige o captura tus datos fiscales para pedir factura.");
      const supabase = await crearClienteServidor();
      const { data: fiscal, error } = await supabase
        .from("billing_profiles")
        .select("*")
        .eq("id", datos.billingProfileId)
        .eq("user_id", sesion.userId)
        .maybeSingle();
      if (error) throw new Error(`No se pudieron cargar tus datos fiscales: ${error.message}`);
      if (!fiscal) throw new Error("Elige datos fiscales válidos.");
      billingData = {
        rfc: fiscal.rfc,
        legal_name: fiscal.legal_name,
        tax_regime: fiscal.tax_regime,
        cfdi_use: fiscal.cfdi_use,
        postal_code: fiscal.postal_code,
      };
    }

    const pedido = await crearPedido({
      userId: sesion.userId,
      items: carrito.items.map((it) => ({ productId: it.productId, qty: it.qty })),
      shippingAddress,
      billingData,
      wantsInvoice: datos.wantsInvoice,
      notes: datos.notes,
    });

    revalidatePath("/carrito");
    revalidatePath("/mi-cuenta/pedidos");
    return pedido;
  });
}
