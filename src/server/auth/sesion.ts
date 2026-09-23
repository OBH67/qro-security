import "server-only";
import { cache } from "react";
import { crearClienteServidor } from "@/server/supabase/server";
import type { ProfileRow } from "@/types/database";

/**
 * Lee la sesión actual + su perfil (`arquitectura.md` §6.3: toda Server
 * Action empieza con `autenticar()` antes de `autorizar()`/`validar()`).
 * Regresa `null` si no hay sesión — nunca lanza, para que cada llamador
 * decida qué hacer (redirigir, 401 de Server Action, etc.).
 *
 * `cache()`: una sola resolución por request aunque la pidan el marco del
 * sitio, el layout y la página a la vez. `getClaims()` verifica la firma
 * del JWT localmente con llaves asimétricas (sin viaje a Supabase Auth); con
 * llaves HS256 heredadas cae solo a `getUser()`, igual que antes.
 */
export const obtenerSesionActual = cache(async (): Promise<{
  userId: string;
  email: string;
  perfil: ProfileRow;
} | null> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`);
  if (!perfil) return null;

  return { userId: claims.sub, email: claims.email ?? perfil.email, perfil };
});

/** Para Server Actions y Route Handlers: exige sesión de cliente, lanza un
 * error de negocio legible si no la hay (arquitectura §6.3 paso 1). */
export async function requerirSesion() {
  const sesion = await obtenerSesionActual();
  if (!sesion) throw new Error("Necesitas iniciar sesión para continuar.");
  return sesion;
}
