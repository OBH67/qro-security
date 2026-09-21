import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo, formatearMoneda } from "./layout";
import { env } from "@/server/config/env";

/** D2.3: "aprobar genera un movimiento de saldo a favor... el cliente lo
 * ve" — este correo es el aviso, además del historial en Mi cuenta →
 * Saldo. */
export async function construirDevolucionAprobada(payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const monto = payload.monto as number;
  const cuerpo = `
    <p>Aprobamos tu devolución <strong>${folio}</strong>.</p>
    <p>Abonamos <strong>${formatearMoneda(monto)}</strong> de saldo a favor a tu cuenta — nunca es en efectivo, lo usas para tu próxima compra.</p>
  `;
  return {
    asunto: `Aprobamos tu devolución ${folio}`,
    html: envolverCorreo({
      titulo: "Tu devolución fue aprobada",
      cuerpoHtml: cuerpo,
      cta: { texto: "Ver mi saldo", url: `${env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/saldo` },
    }),
  };
}
