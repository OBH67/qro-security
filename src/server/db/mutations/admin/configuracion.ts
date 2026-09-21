import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { despacharPendientes } from "@/server/notifications/despachador";

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

/** H4.3: cada llave se guarda con su propia llamada a
 * `actualizar_configuracion()` (0019, service_role-only) — la bitácora
 * queda por campo, igual que F1.5 con precio/stock. */
export async function guardarConfiguracion(params: { valores: Record<string, string>; changedBy: string }): Promise<void> {
  const admin = crearClienteAdmin();
  for (const [key, value] of Object.entries(params.valores)) {
    const { error } = await admin.rpc("actualizar_configuracion", { p_key: key, p_value: value, p_changed_by: params.changedBy });
    if (error) throw new Error(traducirError(error.message));
  }
}

/** H4: "Enviarme un correo de prueba" — la única forma de que quien no
 * es técnico compruebe que los avisos le van a llegar (diseño.md
 * §11.13). Se encola como un evento normal del outbox y se despacha de
 * inmediato, mismo camino que cualquier otro correo transaccional. */
export async function enviarCorreoPrueba(params: { destino: string }): Promise<void> {
  const admin = crearClienteAdmin();
  const { error } = await admin.from("notification_outbox").insert({
    event_type: "configuracion.correo_prueba",
    channel: "correo",
    destino: params.destino,
    payload: {},
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
}
