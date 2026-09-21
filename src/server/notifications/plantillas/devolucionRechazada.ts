import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";

/** D2.4: "rechazar exige un motivo, que el cliente ve" — aquí y en el
 * historial de Mi cuenta → Devoluciones. */
export async function construirDevolucionRechazada(payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const motivo = payload.motivo as string;
  const cuerpo = `
    <p>Revisamos tu solicitud de devolución <strong>${folio}</strong> y no pudimos aprobarla.</p>
    <p style="color:#5D7080;">Motivo: ${motivo}</p>
  `;
  return { asunto: `Sobre tu devolución ${folio}`, html: envolverCorreo({ titulo: "Tu devolución no fue aprobada", cuerpoHtml: cuerpo }) };
}
