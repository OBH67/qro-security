"use server";

import { headers } from "next/headers";
import { esquemaSolicitudServicio } from "@/lib/esquemas/servicio";
import { verificarTurnstile } from "@/server/domain/captcha";
import { crearSolicitudServicio } from "@/server/db/mutations/servicios";
import { accion, type ResultadoAction } from "@/server/actions/_guard";
import type { ServiceRequestRow } from "@/types/database";

/** E1: no requiere sesión (E1.3) — `accion()`, no `conSesion()`. */
export async function enviarSolicitudServicioAction(datosCrudos: unknown): Promise<ResultadoAction<ServiceRequestRow>> {
  return accion(async () => {
    const datos = esquemaSolicitudServicio.parse(datosCrudos);

    // Honeypot (E1.4): un bot que rellenó el campo oculto se descarta con
    // el mismo mensaje de éxito que vería una persona real, para no
    // enseñarle al bot que lo detectamos.
    if (datos.sitioWeb) {
      return {
        id: "descartado",
        folio: "SGQ-000000",
        service_type: datos.serviceType,
        client_type: datos.clientType,
        full_name: datos.fullName,
        phone: datos.phone,
        email: datos.email,
        state: datos.state,
        municipality: datos.municipality,
        neighborhood: null,
        address_reference: null,
        property_type: datos.propertyType,
        preferred_time: null,
        amount: null,
        term_months: null,
        message: null,
        status: "nueva",
        assigned_to: null,
        created_at: new Date().toISOString(),
      } satisfies ServiceRequestRow;
    }

    const listaHeaders = await headers();
    const ip = listaHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || listaHeaders.get("x-real-ip") || undefined;

    const humano = await verificarTurnstile(datos.turnstileToken, ip);
    if (!humano) throw new Error("No pudimos verificar que eres una persona. Intenta de nuevo.");

    return crearSolicitudServicio(datos);
  });
}
