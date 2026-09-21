"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import * as mutations from "@/server/db/mutations/admin/devoluciones";
import { obtenerDetalleDevolucionAdmin, type DetalleDevolucionAdmin } from "@/server/db/queries/admin/devoluciones";
import type { ReturnRow } from "@/types/database";

/** D2.3-D2.4: solo `admin` — Devoluciones no es parte del alcance de
 * `inventario` (H5.1). */

function revalidarDevoluciones() {
  revalidatePath("/admin");
  revalidatePath("/admin/devoluciones");
}

export async function aprobarDevolucionAction(returnId: string, porcentaje: number, reingresarComoNuevo: boolean): Promise<ResultadoAction<ReturnRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) throw new Error("El porcentaje de saldo debe estar entre 0 y 100.");
    const devolucion = await mutations.aprobarDevolucion({ returnId, changedBy: sesion.userId, porcentaje, reingresarComoNuevo });
    revalidarDevoluciones();
    return devolucion;
  });
}

export async function obtenerDetalleDevolucionAction(returnId: string): Promise<ResultadoAction<DetalleDevolucionAdmin | null>> {
  return conSesionStaff(["admin"], async () => obtenerDetalleDevolucionAdmin(returnId));
}

export async function rechazarDevolucionAction(returnId: string, motivo: string): Promise<ResultadoAction<ReturnRow>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!motivo.trim()) throw new Error("Escribe el motivo del rechazo — el cliente lo verá.");
    const devolucion = await mutations.rechazarDevolucion({ returnId, changedBy: sesion.userId, motivo });
    revalidarDevoluciones();
    return devolucion;
  });
}
