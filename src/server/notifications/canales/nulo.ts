import "server-only";
import type { CanalNotificacion, FilaOutbox, ResultadoEnvio } from "../tipos";

/** arquitectura.md §7.3: "el default cuando no hay proveedor" — registra
 * el intento en la bitácora (vía el mensaje de error, que el despachador
 * guarda en `last_error`) sin enviar nada ni reintentar indefinidamente
 * con un error de "no implementado". */
export function crearCanalNulo(nombre: CanalNotificacion["nombre"]): CanalNotificacion {
  return {
    nombre,
    disponible: () => true, // "disponible" para aceptar la fila y resolverla sin reintentos eternos
    async enviar(_fila: FilaOutbox): Promise<ResultadoEnvio> {
      return { ok: false, error: `Canal "${nombre}" sin proveedor configurado — nadie lo recibió.` };
    },
  };
}
