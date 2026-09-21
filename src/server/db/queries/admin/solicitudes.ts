import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { EstadoSolicitudServicio, ServiceRequestRow, TipoServicio } from "@/types/database";

/** E2.1: cada fila trae ya todos los campos capturados — el cajón de
 * detalle (panel-admin-maqueta.html:885-910) no necesita una consulta
 * aparte, a diferencia de Pedidos/Devoluciones que sí agregan datos de
 * varias tablas. */
export interface ConteosSolicitudesPorEstado {
  todas: number;
  nueva: number;
  contactada: number;
  cerrada: number;
}

export async function obtenerSolicitudesAdmin(filtros: { estado?: EstadoSolicitudServicio; servicio?: TipoServicio; busqueda?: string }): Promise<{
  solicitudes: ServiceRequestRow[];
  conteos: ConteosSolicitudesPorEstado;
}> {
  const supabase = await crearClienteServidor();

  let consulta = supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(200);
  if (filtros.estado) consulta = consulta.eq("status", filtros.estado);
  if (filtros.servicio) consulta = consulta.eq("service_type", filtros.servicio);
  if (filtros.busqueda) {
    const termino = filtros.busqueda.trim();
    if (termino) consulta = consulta.or(`full_name.ilike.%${termino}%,email.ilike.%${termino}%,phone.ilike.%${termino}%`);
  }
  const { data: solicitudes, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`);

  const { data: todasParaConteo, error: errorConteo } = await supabase.from("service_requests").select("status");
  if (errorConteo) throw new Error(`No se pudieron contar las solicitudes: ${errorConteo.message}`);
  const conteos: ConteosSolicitudesPorEstado = { todas: todasParaConteo?.length ?? 0, nueva: 0, contactada: 0, cerrada: 0 };
  for (const s of todasParaConteo ?? []) conteos[s.status as keyof typeof conteos]++;

  return { solicitudes: solicitudes ?? [], conteos };
}
