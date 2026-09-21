import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import type { DatosSolicitudServicio } from "@/lib/esquemas/servicio";
import type { ServiceRequestRow } from "@/types/database";

/**
 * E1: crea la solicitud de servicio (lead). La política RLS
 * `service_requests_insert_public` ya permite insertar sin sesión — se usa
 * de cualquier forma el cliente `service_role` (mismo criterio que el
 * resto de escrituras del servidor, arquitectura §6.1) porque el folio
 * necesita `generar_folio()`, que es `service_role`-only (§9.2). Sin
 * candado de concurrencia especial: a diferencia de un pedido, esto no
 * mueve inventario ni dinero — el reintento ante colisión de folio
 * (extremadamente improbable) basta.
 */
export async function crearSolicitudServicio(datos: DatosSolicitudServicio): Promise<ServiceRequestRow> {
  const admin = crearClienteAdmin();

  for (let intento = 0; intento < 8; intento++) {
    const { data: folio, error: errorFolio } = await admin.rpc("generar_folio");
    if (errorFolio) throw new Error(`No se pudo generar el folio: ${errorFolio.message}`);

    const { data, error } = await admin
      .from("service_requests")
      .insert({
        folio,
        service_type: datos.serviceType,
        client_type: datos.clientType,
        full_name: datos.fullName,
        phone: datos.phone,
        email: datos.email,
        state: datos.state,
        municipality: datos.municipality,
        neighborhood: datos.neighborhood || null,
        address_reference: datos.addressReference || null,
        property_type: datos.propertyType,
        preferred_time: datos.preferredTime || null,
        amount: datos.amount ?? null,
        term_months: datos.termMonths ?? null,
        message: datos.message || null,
      })
      .select("*")
      .single();

    if (!error) return data as ServiceRequestRow;
    if (error.code !== "23505") throw new Error(`No se pudo enviar tu solicitud: ${error.message}`);
    // 23505 = unique_violation en folio: reintenta con uno nuevo.
  }

  throw new Error("No se pudo generar un folio único, intenta de nuevo.");
}
