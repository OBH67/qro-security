import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo, tablaProductos, formatearMoneda } from "./layout";

/**
 * H3 "comprobante recibido con enlace de confirmación (al admin)" —
 * criterio C3.1: folio + lista de productos y cantidades + monto total.
 * El "enlace de confirmación de un solo uso" (estado.md decisión #10) es
 * del panel admin (token hasheado, vencimiento) — todavía no existe
 * ningún emisor de ese token en este incremento, así que el correo pide
 * entrar al panel en vez de enlazar un token que no se generó. Agregar el
 * enlace real cuando exista el panel no debería tocar nada más que este
 * archivo (mismo criterio de "un archivo por correo transaccional").
 */
export async function construirComprobanteRecibidoAdmin(
  payload: Record<string, unknown>,
  admin: SupabaseClient,
): Promise<{ asunto: string; html: string } | null> {
  const orderId = payload.order_id as string;
  const folio = payload.folio as string;
  const total = payload.total as string;

  const { data: items } = await admin.from("order_items").select("name, qty, subtotal").eq("order_id", orderId);
  const { data: pedido } = await admin.from("orders").select("user_id").eq("id", orderId).maybeSingle();
  let clienteNombre = "";
  if (pedido) {
    const { data: perfil } = await admin.from("profiles").select("first_name, last_name").eq("id", pedido.user_id).maybeSingle();
    if (perfil) clienteNombre = `${perfil.first_name} ${perfil.last_name}`.trim();
  }

  const cuerpo = `
    <p>Un cliente subió el comprobante de pago del pedido <strong>${folio}</strong>${clienteNombre ? ` (${clienteNombre})` : ""}.</p>
    ${tablaProductos(items ?? [])}
    <p style="margin-top:16px;font-size:17px;font-weight:700;">Total: ${formatearMoneda(total)}</p>
    <p style="margin-top:18px;color:#5D7080;font-size:13.5px;">Entra al panel para revisar el comprobante y confirmar el pago.</p>
  `;

  return { asunto: `Comprobante recibido — Pedido ${folio}`, html: envolverCorreo({ titulo: "Nuevo comprobante para revisar", cuerpoHtml: cuerpo }) };
}
