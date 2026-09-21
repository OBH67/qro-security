"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import * as mutations from "@/server/db/mutations/admin/solicitudes";
import type { ServiceRequestRow } from "@/types/database";

/** E2: solo `admin` — Solicitudes de servicio no es parte del alcance de
 * `inventario` (H5.1). */

function revalidarSolicitudes() {
  revalidatePath("/admin");
  revalidatePath("/admin/solicitudes");
}

export async function marcarEnSeguimientoAction(id: string): Promise<ResultadoAction<ServiceRequestRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    const solicitud = await mutations.actualizarEstadoSolicitud({ id, status: "contactada", changedBy: sesion.userId });
    revalidarSolicitudes();
    return solicitud;
  });
}

export async function marcarCerradaAction(id: string): Promise<ResultadoAction<ServiceRequestRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    const solicitud = await mutations.actualizarEstadoSolicitud({ id, status: "cerrada", changedBy: sesion.userId });
    revalidarSolicitudes();
    return solicitud;
  });
}
