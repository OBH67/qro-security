import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";
import { env } from "@/server/config/env";

export async function construirPedidoEntregado(payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const cuerpo = `<p>Tu pedido <strong>${folio}</strong> fue entregado. Gracias por tu compra.</p><p>Si algo no llegó como esperabas, puedes solicitar una devolución desde tu cuenta.</p>`;
  return {
    asunto: `Tu pedido ${folio} fue entregado`,
    html: envolverCorreo({
      titulo: "Tu pedido fue entregado",
      cuerpoHtml: cuerpo,
      cta: { texto: "Ver mi pedido", url: `${env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/pedidos/${folio}` },
    }),
  };
}
