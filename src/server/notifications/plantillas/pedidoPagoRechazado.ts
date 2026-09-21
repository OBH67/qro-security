import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";
import { env } from "@/server/config/env";

/** C5.5: rechazar un comprobante regresa el pedido a pendiente_pago con
 * un motivo que el cliente ve — este correo es el aviso, además de la
 * bandeja de "Mis pedidos". */
export async function construirPedidoPagoRechazado(
  payload: Record<string, unknown>,
  _admin: SupabaseClient,
): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const motivo = (payload.motivo as string) || "No cumplió con lo esperado, revisa los datos de tu transferencia.";
  const cuerpo = `
    <p>No pudimos validar el comprobante que subiste para el pedido <strong>${folio}</strong>.</p>
    <p style="color:#5D7080;">Motivo: ${motivo}</p>
    <p>Puedes subir un nuevo comprobante desde tu cuenta.</p>
  `;
  return {
    asunto: `Revisa tu comprobante — Pedido ${folio}`,
    html: envolverCorreo({
      titulo: "Tu comprobante necesita revisión",
      cuerpoHtml: cuerpo,
      cta: { texto: "Subir comprobante de nuevo", url: `${env.NEXT_PUBLIC_SITE_URL}/mi-cuenta/pedidos/${folio}/comprobante` },
    }),
  };
}
