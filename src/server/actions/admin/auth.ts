"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { esquemaLogin } from "@/lib/esquemas/registro";
import { crearClienteServidor } from "@/server/supabase/server";
import { intentarConsumirLimite } from "@/server/auth/limites";
import { esRolStaff } from "@/server/auth/roles";
import { accion, type ResultadoAction } from "@/server/actions/_guard";

/** H2/§9.8: 5 intentos por 15 minutos por correo — mismo criterio y misma
 * tabla `rate_limits` que ya usa E1.4 (servicios), solo cambia el scope. */
const LIMITE_LOGIN_STAFF = { maxIntentos: 5, ventanaMinutos: 15 };

/**
 * H2: login del panel — mismo Supabase Auth que el cliente (arquitectura
 * §1, un solo proveedor de identidad para todo el sistema), pero aquí se
 * verifica el rol DESPUÉS de autenticar: si la cuenta es válida pero no
 * es `admin`/`inventario`, se cierra la sesión que Auth ya abrió antes de
 * regresar el error — un cliente normal nunca debe quedar con una sesión
 * activa dentro de `/admin`, ni un segundo.
 */
export async function iniciarSesionStaffAction(datosCrudos: unknown): Promise<ResultadoAction<{ ok: true }>> {
  return accion(async () => {
    const datos = esquemaLogin.parse(datosCrudos);

    const listaHeaders = await headers();
    const ip = listaHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || listaHeaders.get("x-real-ip") || undefined;
    const permitidoPorCorreo = await intentarConsumirLimite("login_staff_email", datos.email.toLowerCase(), LIMITE_LOGIN_STAFF);
    const permitidoPorIp = await intentarConsumirLimite("login_staff_ip", ip, LIMITE_LOGIN_STAFF);
    if (!permitidoPorCorreo || !permitidoPorIp) {
      throw new Error("Demasiados intentos. Espera unos minutos e intenta de nuevo.");
    }

    const supabase = await crearClienteServidor();
    const { error: errorAuth } = await supabase.auth.signInWithPassword({ email: datos.email, password: datos.password });
    if (errorAuth) throw new Error("Correo o contraseña incorrectos.");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: perfil } = await supabase.from("profiles").select("role").eq("id", user!.id).maybeSingle();

    if (!perfil || !esRolStaff(perfil.role)) {
      await supabase.auth.signOut();
      throw new Error("Esta cuenta no tiene acceso al panel administrativo.");
    }

    return { ok: true as const };
  });
}

export async function cerrarSesionStaffAction(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/admin/ingresar");
}
