import "server-only";
import { obtenerCarritoResuelto } from "@/server/db/queries/carrito";
import { obtenerDireccionPorId } from "@/server/db/queries/cuenta";
import { crearClienteServidor } from "@/server/supabase/server";
import type { DatosFiscalesCongelados, DireccionCongelada } from "@/types/database";

export interface DatosPedidoArmados {
  items: { productId: string; qty: number }[];
  subtotal: number;
  shippingAddress: DireccionCongelada;
  billingData: DatosFiscalesCongelados | null;
}

/** Carrito + dirección + datos fiscales congelados del cliente, validados
 * contra su sesión. Lo comparten el flujo de comprobante
 * (`generarPedidoAction`) y el de tarjeta (`prepararPagoTarjetaAction`). */
export async function armarDatosPedido(
  userId: string,
  datos: { addressId: string; wantsInvoice: boolean; billingProfileId?: string },
): Promise<DatosPedidoArmados> {
  const carrito = await obtenerCarritoResuelto(userId);
  if (carrito.items.length === 0) {
    throw new Error("Tu pedido está vacío. Agrega productos antes de continuar.");
  }

  const direccion = await obtenerDireccionPorId(datos.addressId);
  if (!direccion || direccion.user_id !== userId) {
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
      .eq("user_id", userId)
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

  return {
    items: carrito.items.map((it) => ({ productId: it.productId, qty: it.qty })),
    subtotal: carrito.subtotal,
    shippingAddress,
    billingData,
  };
}
