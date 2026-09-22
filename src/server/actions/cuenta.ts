"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/server/supabase/server";
import { env } from "@/server/config/env";
import { esquemaRegistro, esquemaLogin, esquemaRecuperar } from "@/lib/esquemas/registro";
import { accion, type ResultadoAction } from "@/server/actions/_guard";

/**
 * B2: registro, inicio/cierre de sesión y recuperación de contraseña.
 * Usa Supabase Auth (ya configurado, `arquitectura.md` §1) — el hash de la
 * contraseña lo maneja Auth, nunca se toca en texto plano (B2.2). El
 * trigger `on_auth_user_created` (0002) crea `profiles` automáticamente a
 * partir de los metadatos que aquí se mandan.
 */

export async function registrarCliente(datosCrudos: unknown): Promise<ResultadoAction<{ requiereVerificacion: boolean }>> {
  return accion(async () => {
    const datos = esquemaRegistro.parse(datosCrudos);
    const supabase = await crearClienteServidor();

    const { data, error } = await supabase.auth.signUp({
      email: datos.email,
      password: datos.password,
      options: {
        data: { first_name: datos.firstName, last_name: datos.lastName, phone: datos.phone },
        emailRedirectTo: `${env.NEXT_PUBLIC_SITE_URL}/ingresar`,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already registered") || error.code === "user_already_exists") {
        throw new Error("Ya existe una cuenta con ese correo. Intenta iniciar sesión.");
      }
      throw new Error(error.message);
    }

    // Correo único (B2.2): Supabase Auth ya lo garantiza a nivel de
    // esquema; `data.user.identities` viene vacío cuando el correo ya
    // existía pero Auth no regresó error por configuración de privacidad.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("Ya existe una cuenta con ese correo. Intenta iniciar sesión.");
    }

    // §9.9: la verificación no bloquea la compra — se manda el correo pero
    // la sesión ya queda activa si Supabase Auth no exige confirmación.
    return { requiereVerificacion: !data.session };
  });
}

export async function iniciarSesion(datosCrudos: unknown): Promise<ResultadoAction<{ ok: true }>> {
  return accion(async () => {
    const datos = esquemaLogin.parse(datosCrudos);
    const supabase = await crearClienteServidor();
    const { error } = await supabase.auth.signInWithPassword({ email: datos.email, password: datos.password });
    if (error) {
      // `email_not_confirmed` no es "correo o contraseña incorrectos" — es
      // una cuenta real con la contraseña correcta, bloqueada porque el
      // proyecto exige confirmar el correo antes de iniciar sesión
      // (`supabase/config.toml`, `[auth.email] enable_confirmations`, o la
      // configuración del proyecto si es uno alojado). Mapear los dos
      // casos al mismo mensaje genérico hacía perder este caso: la cuenta
      // aparecía creada en Auth pero el login "no funcionaba" sin ninguna
      // pista de por qué.
      if (error.code === "email_not_confirmed") {
        throw new Error("Tu correo todavía no está confirmado. Revisa tu bandeja de entrada (o la carpeta de spam) y confirma tu cuenta antes de iniciar sesión.");
      }
      throw new Error("Correo o contraseña incorrectos.");
    }
    return { ok: true as const };
  });
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}

export async function solicitarRecuperacion(datosCrudos: unknown): Promise<ResultadoAction<{ ok: true }>> {
  return accion(async () => {
    const datos = esquemaRecuperar.parse(datosCrudos);
    const supabase = await crearClienteServidor();
    // No se revela si el correo existe o no (mismo mensaje siempre) — evita
    // que el formulario se use para enumerar cuentas registradas.
    await supabase.auth.resetPasswordForEmail(datos.email, {
      redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/ingresar`,
    });
    return { ok: true as const };
  });
}
