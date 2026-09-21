import "server-only";
import { obtenerSesionStaff, type RolStaff } from "@/server/auth/roles";
import { ok, fallo, type ResultadoAction } from "@/server/actions/_guard";

export type { ResultadoAction };

/** H2 (capa 3, la última — arquitectura §6.4): toda Server Action del
 * panel vuelve a exigir sesión de staff, sin confiar en que el layout ya
 * filtró. `rolesPermitidos` cubre H5: una acción fuera del alcance de
 * `inventario` (todo salvo Catálogo) nunca se ejecuta aunque alguien
 * arme la llamada a mano. */
export async function conSesionStaff<T>(
  rolesPermitidos: RolStaff[],
  fn: (sesion: NonNullable<Awaited<ReturnType<typeof obtenerSesionStaff>>>) => Promise<T>,
): Promise<ResultadoAction<T>> {
  try {
    const sesion = await obtenerSesionStaff();
    if (!sesion) return fallo(new Error("Necesitas iniciar sesión en el panel para continuar."));
    if (!rolesPermitidos.includes(sesion.rol)) return fallo(new Error("Tu cuenta no tiene permiso para esta acción."));
    return ok(await fn(sesion));
  } catch (error) {
    return fallo(error);
  }
}
