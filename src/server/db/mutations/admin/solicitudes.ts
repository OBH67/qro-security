import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import type { EstadoSolicitudServicio, ServiceRequestRow } from "@/types/database";

/** E2: cambio de estado directo, sin función SQL — a diferencia de
 * Pedidos/Devoluciones, aquí no hay inventario, dinero ni concurrencia
 * que proteger (mismo razonamiento que `mutations/servicios.ts` para la
 * creación del lead), así que un `update` con `service_role` basta. */
export async function actualizarEstadoSolicitud(params: { id: string; status: EstadoSolicitudServicio; changedBy: string }): Promise<ServiceRequestRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from("service_requests")
    .update({ status: params.status, assigned_to: params.changedBy })
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo actualizar la solicitud: ${error.message}`);
  return data as ServiceRequestRow;
}
