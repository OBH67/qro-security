import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envolverCorreo } from "./layout";

const ETIQUETA_SERVICIO: Record<string, string> = {
  monitoreo: "Monitoreo de alarmas 24/7",
  guardias: "Guardias de seguridad",
  financiamiento: "Financiamiento y créditos",
};

/** E2 (aunque la bandeja del panel no exista todavía, el admin necesita
 * enterarse de un lead nuevo igual — el correo no depende del panel). */
export async function construirServicioSolicitadoAdmin(
  payload: Record<string, unknown>,
  _admin: SupabaseClient,
): Promise<{ asunto: string; html: string } | null> {
  const folio = payload.folio as string;
  const tipo = ETIQUETA_SERVICIO[payload.service_type as string] ?? (payload.service_type as string);
  const nombre = payload.full_name as string;
  const telefono = payload.phone as string;
  const correo = payload.email as string;

  const cuerpo = `
    <p>Nueva solicitud de servicio: <strong>${tipo}</strong> (${folio}).</p>
    <p>${nombre} · ${telefono} · ${correo}</p>
  `;
  return { asunto: `Nueva solicitud de servicio — ${tipo}`, html: envolverCorreo({ titulo: "Nueva solicitud de servicio", cuerpoHtml: cuerpo }) };
}

/** E1.5: "confirmación al usuario en pantalla y por correo". */
export async function construirServicioSolicitadoCliente(
  payload: Record<string, unknown>,
  _admin: SupabaseClient,
): Promise<{ asunto: string; html: string } | null> {
  const tipo = ETIQUETA_SERVICIO[payload.service_type as string] ?? (payload.service_type as string);
  const cuerpo = `
    <p>Recibimos tu solicitud de <strong>${tipo}</strong>.</p>
    <p>Un asesor te contactará en menos de 24 horas.</p>
  `;
  return { asunto: "Recibimos tu solicitud", html: envolverCorreo({ titulo: "Recibimos tu solicitud", cuerpoHtml: cuerpo }) };
}
