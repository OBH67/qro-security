import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";

export async function construirPedidoCancelado(payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const motivo = (payload.motivo as string) || null;
  const cuerpo = `
    <p>Tu pedido <strong>${folio}</strong> fue cancelado.</p>
    ${motivo ? `<p style="color:#5D7080;">Motivo: ${motivo}</p>` : ""}
    <p>Si tenías saldo a favor aplicado, ya se devolvió íntegro a tu cuenta.</p>
  `;
  return { asunto: `Pedido ${folio} cancelado`, html: envolverCorreo({ titulo: "Tu pedido fue cancelado", cuerpoHtml: cuerpo }) };
}
