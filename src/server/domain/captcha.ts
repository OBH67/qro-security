import "server-only";
import { env } from "@/server/config/env";

/**
 * E1.4: verifica el token de Cloudflare Turnstile contra la API real de
 * Cloudflare (nunca solo "si llegó un token" — eso lo puede fabricar
 * cualquier bot). El honeypot del formulario (`esquemas/servicio.ts`,
 * campo `sitioWeb`) es una segunda capa, no un sustituto: Turnstile
 * detiene bots automatizados reales, el honeypot detiene los más
 * simples/viejos que ni ejecutan JavaScript.
 */
export async function verificarTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!token) return false;

  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip) body.set("remoteip", ip);

  const respuesta = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!respuesta.ok) return false;

  const resultado: { success: boolean } = await respuesta.json();
  return resultado.success === true;
}
