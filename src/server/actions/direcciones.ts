"use server";

import { revalidatePath } from "next/cache";
import { esquemaDireccion } from "@/lib/esquemas/direccion";
import { crearDireccion, eliminarDireccion } from "@/server/db/mutations/cuenta";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import type { AddressRow } from "@/types/database";

/** B3.1: guardar dirección de envío. */
export async function guardarDireccion(datosCrudos: unknown): Promise<ResultadoAction<AddressRow>> {
  return conSesion(async (sesion) => {
    const datos = esquemaDireccion.parse(datosCrudos);
    const direccion = await crearDireccion(sesion.userId, datos);
    revalidatePath("/mi-cuenta/direcciones");
    revalidatePath("/pagar");
    return direccion;
  });
}

export async function borrarDireccion(addressId: string): Promise<ResultadoAction<{ ok: true }>> {
  return conSesion(async (sesion) => {
    await eliminarDireccion(sesion.userId, addressId);
    revalidatePath("/mi-cuenta/direcciones");
    revalidatePath("/pagar");
    return { ok: true as const };
  });
}
