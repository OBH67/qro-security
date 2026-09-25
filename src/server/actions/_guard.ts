import "server-only";
import { obtenerSesionActual } from "@/server/auth/sesion";

/**
 * Resultado uniforme de toda Server Action de este incremento: nunca se
 * lanza una excepción hacia el cliente (Next.js la convertiría en un error
 * genérico de servidor) — se atrapa aquí y se regresa como dato, en
 * español de negocio, para que el formulario la muestre (arquitectura
 * §6.3, paso 5 sigue siendo "registrar", pero antes: nunca un mensaje
 * técnico llega a la pantalla del cliente).
 */
export type ResultadoAction<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T): ResultadoAction<T> {
  return { ok: true, data };
}

export function fallo(error: unknown): ResultadoAction<never> {
  // Sin este log el error solo viajaba al navegador como dato y no quedaba
  // rastro en los logs de Vercel (incidente del checkout, 25-sep).
  console.error("[server action]", error);
  const mensaje = error instanceof Error ? error.message : "Ocurrió un error inesperado. Intenta de nuevo.";
  return { ok: false, error: mensaje };
}

/** Paso 1 de toda Server Action que requiere sesión de cliente
 * (arquitectura §6.3): autenticar antes de autorizar/validar. */
export async function conSesion<T>(fn: (sesion: NonNullable<Awaited<ReturnType<typeof obtenerSesionActual>>>) => Promise<T>): Promise<ResultadoAction<T>> {
  try {
    const sesion = await obtenerSesionActual();
    if (!sesion) return fallo(new Error("Necesitas iniciar sesión para continuar."));
    return ok(await fn(sesion));
  } catch (error) {
    return fallo(error);
  }
}

export async function accion<T>(fn: () => Promise<T>): Promise<ResultadoAction<T>> {
  try {
    return ok(await fn());
  } catch (error) {
    return fallo(error);
  }
}
