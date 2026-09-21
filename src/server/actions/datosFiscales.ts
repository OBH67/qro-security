"use server";

import { revalidatePath } from "next/cache";
import { esquemaDatosFiscales } from "@/lib/esquemas/datosFiscales";
import { crearDatosFiscales, eliminarDatosFiscales } from "@/server/db/mutations/cuenta";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import type { BillingProfileRow } from "@/types/database";

/** B3.2/B3.3: datos fiscales opcionales; obligatorios en formato solo si
 * el cliente pidió factura (el esquema ya valida el formato del RFC). */
export async function guardarDatosFiscales(datosCrudos: unknown): Promise<ResultadoAction<BillingProfileRow>> {
  return conSesion(async (sesion) => {
    const datos = esquemaDatosFiscales.parse(datosCrudos);
    const registro = await crearDatosFiscales(sesion.userId, datos);
    revalidatePath("/mi-cuenta/datos-fiscales");
    revalidatePath("/pagar");
    return registro;
  });
}

export async function borrarDatosFiscales(billingProfileId: string): Promise<ResultadoAction<{ ok: true }>> {
  return conSesion(async (sesion) => {
    await eliminarDatosFiscales(sesion.userId, billingProfileId);
    revalidatePath("/mi-cuenta/datos-fiscales");
    revalidatePath("/pagar");
    return { ok: true as const };
  });
}
