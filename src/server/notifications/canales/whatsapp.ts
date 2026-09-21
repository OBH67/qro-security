import "server-only";
import { env } from "@/server/config/env";
import type { CanalNotificacion, FilaOutbox, ResultadoEnvio } from "../tipos";

/**
 * arquitectura.md §7.3: "conectar WhatsApp después no toca nada más que
 * un archivo". `disponible()` regresa `false` mientras PA-5 (proveedor y
 * número) siga sin resolverse — el despachador entonces usa `nulo.ts`
 * para ese canal en vez de este archivo. Cuando exista el proveedor real
 * (Meta Cloud API o Twilio), la implementación de `enviar()` va aquí sin
 * tocar el despachador ni los canales de correo.
 */
export function crearCanalWhatsapp(): CanalNotificacion {
  return {
    nombre: "whatsapp",
    disponible: () => env.WHATSAPP_PROVIDER !== "none" && Boolean(env.WHATSAPP_ACCESS_TOKEN),
    async enviar(_fila: FilaOutbox): Promise<ResultadoEnvio> {
      return { ok: false, error: `WHATSAPP_PROVIDER="${env.WHATSAPP_PROVIDER}" — proveedor no implementado todavía (PA-5).` };
    },
  };
}
