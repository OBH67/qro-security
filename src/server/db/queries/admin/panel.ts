import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";

/** H6.2/G2.2: los contadores que decoran el sidebar y el tablero — todo
 * lo que "requiere atención hoy". Cliente CON SESIÓN: RLS ya solo deja
 * pasar a `admin`/`inventario` en estas tablas (0007). */
export interface ContadoresPanel {
  comprobantesPorValidar: number;
  devolucionesPendientes: number;
  solicitudesNuevas: number;
}

export async function obtenerContadoresPanel(): Promise<ContadoresPanel> {
  const supabase = await crearClienteServidor();

  const [comprobantes, devoluciones, solicitudes] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "comprobante_recibido"),
    supabase.from("returns").select("id", { count: "exact", head: true }).in("status", ["solicitada", "en_revision"]),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("status", "nueva"),
  ]);

  if (comprobantes.error) throw new Error(`No se pudieron cargar los pedidos: ${comprobantes.error.message}`);
  if (devoluciones.error) throw new Error(`No se pudieron cargar las devoluciones: ${devoluciones.error.message}`);
  if (solicitudes.error) throw new Error(`No se pudieron cargar las solicitudes: ${solicitudes.error.message}`);

  return {
    comprobantesPorValidar: comprobantes.count ?? 0,
    devolucionesPendientes: devoluciones.count ?? 0,
    solicitudesNuevas: solicitudes.count ?? 0,
  };
}
