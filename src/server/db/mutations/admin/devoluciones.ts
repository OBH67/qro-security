import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { despacharPendientes } from "@/server/notifications/despachador";
import type { ReturnRow } from "@/types/database";

/** D2.3-D2.4 — llama a `resolver_devolucion()` (0018, service_role-only)
 * y despacha el correo encolado justo después (mismo criterio que
 * `mutations/admin/pedidos.ts`: C3.2). */

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

export async function aprobarDevolucion(params: {
  returnId: string;
  changedBy: string;
  porcentaje: number;
  reingresarComoNuevo: boolean;
}): Promise<ReturnRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("resolver_devolucion", {
    p_return_id: params.returnId,
    p_aprobar: true,
    p_changed_by: params.changedBy,
    p_percentage: params.porcentaje,
    p_reingresar_como_nuevo: params.reingresarComoNuevo,
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as ReturnRow;
}

export async function rechazarDevolucion(params: { returnId: string; changedBy: string; motivo: string }): Promise<ReturnRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("resolver_devolucion", {
    p_return_id: params.returnId,
    p_aprobar: false,
    p_changed_by: params.changedBy,
    p_resolution_note: params.motivo,
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as ReturnRow;
}
