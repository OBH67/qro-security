import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";
import { env } from "@/server/config/env";

export async function construirPedidoEnviado(payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const cuerpo = `<p>Tu pedido <strong>${folio}</strong> ya salió hacia tu dirección de entrega.</p>`;
  return {
    asunto: `Tu pedido ${folio} ya va en camino`,
    html: envolverCorreo({
      titulo: "Tu pedido fue enviado",
      cuerpoHtml: cuerpo,
      cta: { texto: "Ver mi pedido", url: `${env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/pedidos/${folio}` },
    }),
  };
}
