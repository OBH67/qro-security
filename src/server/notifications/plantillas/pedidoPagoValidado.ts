import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";
import { env } from "@/server/config/env";

/** C5.3: al validar el pago, el pedido pasa a "Listo para envío" — el
 * cliente lo sabe por aquí, no solo entrando a revisar "Mis pedidos". */
export async function construirPedidoPagoValidado(payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const cuerpo = `<p>Confirmamos tu pago del pedido <strong>${folio}</strong>. Ya está listo para enviarse.</p>`;
  return {
    asunto: `Tu pago fue confirmado — Pedido ${folio}`,
    html: envolverCorreo({
      titulo: "Tu pago fue confirmado",
      cuerpoHtml: cuerpo,
      cta: { texto: "Ver mi pedido", url: `${env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/pedidos/${folio}` },
    }),
  };
}
