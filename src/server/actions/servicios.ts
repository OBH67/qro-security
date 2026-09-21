"use server";

import { headers } from "next/headers";
import { esquemaSolicitudServicio } from "@/lib/esquemas/servicio";
import { verificarTurnstile } from "@/server/domain/captcha";
import { intentarConsumirLimite } from "@/server/auth/limites";
import { crearSolicitudServicio } from "@/server/db/mutations/servicios";
import { accion, type ResultadoAction } from "@/server/actions/_guard";
import type { ServiceRequestRow } from "@/types/database";

/** E1.4 / arquitectura.md §9.8: "5 solicitudes de servicio por hora por IP". */
const LIMITE_SERVICIO_IP = { maxIntentos: 5, ventanaMinutos: 60 };

/** E1: no requiere sesión (E1.3) — `accion()`, no `conSesion()`. */
export async function enviarSolicitudServicioAction(datosCrudos: unknown): Promise<ResultadoAction<ServiceRequestRow>> {
  return accion(async () => {
    const datos = esquemaSolicitudServicio.parse(datosCrudos);

    const listaHeaders = await headers();
    const ip = listaHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || listaHeaders.get("x-real-ip") || undefined;

    // Límite por IP (E1.4/§9.8) primero: barato, y evita gastar una
    // verificación de Turnstile (llamada externa) en quien ya está
    // limitado. Se consume el intento incluso si resulta ser el
    // honeypot — un bot no debe poder usar el honeypot como escapatoria
    // del límite.
    const permitido = await intentarConsumirLimite("servicio_ip", ip, LIMITE_SERVICIO_IP);
    if (!permitido) throw new Error("Ya enviaste varias solicitudes en poco tiempo. Intenta de nuevo más tarde.");

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

    const humano = await verificarTurnstile(datos.turnstileToken, ip);
    if (!humano) throw new Error("No pudimos verificar que eres una persona. Intenta de nuevo.");

    return crearSolicitudServicio(datos);
  });
}
