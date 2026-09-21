import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";
import { env } from "@/server/config/env";

/** C2.4: "el cliente ve el aviso de compra completada y el mensaje de que
 * un agente lo contactará en máximo 24 horas" — hoy solo se mostraba en
 * pantalla (`FormularioComprobante.tsx`); este correo es el respaldo por
 * si el cliente cierra la pestaña antes de leerlo. */
export async function construirComprobanteRecibidoCliente(
  payload: Record<string, unknown>,
  _admin: SupabaseClient,
): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;

  const cuerpo = `
    <p>Recibimos tu comprobante del pedido <strong>${folio}</strong>.</p>
    <p>Un agente de ventas se pondrá en contacto contigo en un lapso máximo de 24 horas para confirmar tu pago, el envío y la fecha de entrega.</p>
  `;

  return {
    asunto: `Recibimos tu comprobante — Pedido ${folio}`,
    html: envolverCorreo({
      titulo: "¡Tu compra se completó con éxito!",
      cuerpoHtml: cuerpo,
      cta: { texto: "Ver mi pedido", url: `${env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/pedidos/${folio}` },
    }),
  };
}
