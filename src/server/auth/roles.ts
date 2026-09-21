import "server-only";
import { obtenerSesionActual } from "@/server/auth/sesion";
import type { RolUsuario } from "@/types/database";

export type RolStaff = "admin" | "inventario";

/**
 * H2/H5: candado de roles del panel — arquitectura.md §6.4, capa 2 (la
 * capa 1 es `proxy.ts`, que ya redirige sin sesión; esta nunca confía en
 * que esa capa ya filtró). Regresa `null` si no hay sesión o el rol no es
 * de staff, para que el llamador decida (layout redirige, Server Action
 * regresa error de negocio).
 */
export async function obtenerSesionStaff(): Promise<{ userId: string; email: string; nombre: string; rol: RolStaff } | null> {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;
  if (!esRolStaff(sesion.perfil.role)) return null;
  return {
    userId: sesion.userId,
    email: sesion.email,
    nombre: `${sesion.perfil.first_name} ${sesion.perfil.last_name}`.trim(),
    rol: sesion.perfil.role,
  };
}

export function esRolStaff(rol: RolUsuario): rol is RolStaff {
  return rol === "admin" || rol === "inventario";
}

/** H5.1: rutas del panel que el rol `inventario` puede ver — solo
 * Catálogo (F1, F2, F3). Todo lo demás ni aparece en su menú (H5.1) ni
 * responde si escribe la URL a mano (H5.2). */
const RUTAS_INVENTARIO = ["/admin/catalogo"];

export function rutaPermitidaParaRol(pathname: string, rol: RolStaff): boolean {
  if (rol === "admin") return true;
  return RUTAS_INVENTARIO.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}
