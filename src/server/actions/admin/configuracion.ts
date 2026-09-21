"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import * as mutations from "@/server/db/mutations/admin/configuracion";
import { validarClabe } from "@/lib/clabe";

/** H4.1: solo `admin` — Configuración no aparece en el menú de
 * `inventario` (H5.1). */

function revalidarConfiguracion() {
  revalidatePath("/admin");
  revalidatePath("/admin/configuracion");
  revalidatePath("/pagar");
  revalidatePath("/mi-cuenta/pedidos");
}

export async function guardarDatosBancariosAction(datos: { bankName: string; beneficiary: string; clabe: string; accountNumber: string }): Promise<ResultadoAction<null>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!datos.bankName.trim() || !datos.beneficiary.trim()) throw new Error("Banco y beneficiario son obligatorios.");
    const { valida, error } = validarClabe(datos.clabe);
    if (!valida) throw new Error(error ?? "CLABE inválida.");

    await mutations.guardarConfiguracion({
      valores: { bank_name: datos.bankName.trim(), beneficiary: datos.beneficiary.trim(), clabe: datos.clabe.trim(), account_number: datos.accountNumber.trim() },
      changedBy: sesion.userId,
    });
    revalidarConfiguracion();
    return null;
  });
}

export async function guardarContactoAction(datos: { adminEmail: string; adminWhatsapp: string }): Promise<ResultadoAction<null>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!datos.adminEmail.trim() || !/.+@.+\..+/.test(datos.adminEmail)) throw new Error("Escribe un correo válido para los avisos.");

    await mutations.guardarConfiguracion({
      valores: { admin_email: datos.adminEmail.trim(), admin_whatsapp: datos.adminWhatsapp.trim() },
      changedBy: sesion.userId,
    });
    revalidarConfiguracion();
    return null;
  });
}

export async function guardarPlazosAction(datos: { returnWindowDays: number; orderAutoCancelDays: number }): Promise<ResultadoAction<null>> {
  return conSesionStaff(["admin"], async (sesion) => {
    if (!Number.isInteger(datos.returnWindowDays) || datos.returnWindowDays < 1) throw new Error("Los días para devolución deben ser un número entero mayor a 0.");
    if (!Number.isInteger(datos.orderAutoCancelDays) || datos.orderAutoCancelDays < 1) throw new Error("Los días para cancelar un pedido deben ser un número entero mayor a 0.");

    await mutations.guardarConfiguracion({
      valores: { return_window_days: String(datos.returnWindowDays), order_auto_cancel_days: String(datos.orderAutoCancelDays) },
      changedBy: sesion.userId,
    });
    revalidarConfiguracion();
    return null;
  });
}

export async function enviarCorreoPruebaAction(destino: string): Promise<ResultadoAction<null>> {
  return conSesionStaff(["admin"], async () => {
    if (!destino.trim() || !/.+@.+\..+/.test(destino)) throw new Error("Escribe un correo válido antes de mandar la prueba.");
    await mutations.enviarCorreoPrueba({ destino: destino.trim() });
    return null;
  });
}
