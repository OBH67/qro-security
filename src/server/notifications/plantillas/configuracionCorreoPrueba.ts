import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";

/** H4: botón "Enviarme un correo de prueba" — sin datos que citar del
 * payload, solo confirma que el canal funciona. */
export async function construirConfiguracionCorreoPrueba(_payload: Record<string, unknown>, _admin: SupabaseClient): Promise<{ asunto: string; html: string } | null> {
  const cuerpo = `<p>Este es un correo de prueba desde el panel de SG Querétaro.</p><p>Si lo recibiste, los avisos de comprobante recibido y las solicitudes de servicio te van a llegar sin problema a esta dirección.</p>`;
  return { asunto: "Correo de prueba — Panel SG Querétaro", html: envolverCorreo({ titulo: "Correo de prueba", cuerpoHtml: cuerpo }) };
}
