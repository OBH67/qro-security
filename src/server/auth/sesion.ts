import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { ProfileRow } from "@/types/database";

/**
 * Lee la sesión actual + su perfil (`arquitectura.md` §6.3: toda Server
 * Action empieza con `autenticar()` antes de `autorizar()`/`validar()`).
 * Regresa `null` si no hay sesión — nunca lanza, para que cada llamador
 * decida qué hacer (redirigir, 401 de Server Action, etc.).
 */
export async function obtenerSesionActual(): Promise<{
  userId: string;
  email: string;
  perfil: ProfileRow;
} | null> {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el perfil: ${error.message}`);
  if (!perfil) return null;

  return { userId: user.id, email: user.email ?? perfil.email, perfil };
}

/** Para Server Actions y Route Handlers: exige sesión de cliente, lanza un
 * error de negocio legible si no la hay (arquitectura §6.3 paso 1). */
export async function requerirSesion() {
  const sesion = await obtenerSesionActual();
  if (!sesion) throw new Error("Necesitas iniciar sesión para continuar.");
  return sesion;
}
