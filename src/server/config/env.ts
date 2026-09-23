import "server-only";
import { z } from "zod";

/**
 * Validación de variables de entorno al arrancar la aplicación.
 * Fuente: `.devsquad/arquitectura.md` §10. Si falta o tiene forma
 * incorrecta una variable requerida, la aplicación no levanta y el
 * mensaje de error dice exactamente cuál — en vez de fallar en
 * producción cuando alguien sube un comprobante.
 *
 * Regla del prefijo: `NEXT_PUBLIC_` = viaja al navegador. Todo lo demás
 * vive solo en el servidor (por eso este archivo importa 'server-only').
 */

const envSchema = z.object({
  // ── 10.1 Base y Supabase ──────────────────────────────────────────
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Solo hace falta en local/CI para correr migraciones con la CLI.
  SUPABASE_DB_URL: z.string().min(1).optional(),

  // ── 10.2 Cloudflare R2 ────────────────────────────────────────────
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_PUBLIC: z.string().min(1),
  R2_BUCKET_PRIVATE: z.string().min(1),
  NEXT_PUBLIC_R2_PUBLIC_URL: z.url(),

  // ── 10.3 Correo (Resend) ──────────────────────────────────────────
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.email(),
  EMAIL_REPLY_TO: z.email(),

  // ── 10.4 WhatsApp — opcional hasta que Meta apruebe el número ────
  WHATSAPP_PROVIDER: z.enum(["none", "meta", "twilio"]).default("none"),
  // Específicas de Meta Cloud API.
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
  WHATSAPP_TEMPLATE_NAME: z.string().min(1).optional(),
  // Específicas de Twilio (Sandbox o número de WhatsApp Business).
  TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
  TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
  // Formato E.164 con prefijo "whatsapp:", ej. "whatsapp:+14155238886"
  // (el número compartido del Sandbox de Twilio).
  TWILIO_WHATSAPP_FROM: z.string().min(1).optional(),

  // ── 10.5 Seguridad y operación ────────────────────────────────────
  PAYMENT_TOKEN_PEPPER: z.string().min(16),
  CRON_SECRET: z.string().min(16),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  // Sugeridos en arquitectura.md §10.5; con default hasta que existan
  // pantallas en `settings` para editarlos sin desplegar.
  ADMIN_SESSION_MAX_AGE_MINUTES: z.coerce.number().int().positive().default(120),
  // Confirmado por la dueña del proyecto (requerimientos.md PA-7, 2026-09-20): 3 días.
  ORDER_AUTO_CANCEL_DAYS: z.coerce.number().int().positive().default(3),
  // Confirmado por la dueña del proyecto (requerimientos.md PA-3, 2026-09-20): 30 días.
  RETURN_WINDOW_DAYS: z.coerce.number().int().positive().default(30),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const detalles = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(
      `Faltan o son inválidas las siguientes variables de entorno:\n${detalles}\n\n` +
        "Revisa `.env.example` para ver la lista completa y para qué sirve cada una.",
    );
  }

  if (parsed.data.WHATSAPP_PROVIDER === "meta" && !parsed.data.WHATSAPP_ACCESS_TOKEN) {
    throw new Error(
      "WHATSAPP_PROVIDER=meta pero falta WHATSAPP_ACCESS_TOKEN. " +
        "Usa WHATSAPP_PROVIDER=none mientras no haya credenciales de Meta.",
    );
  }
  if (
    parsed.data.WHATSAPP_PROVIDER === "twilio" &&
    (!parsed.data.TWILIO_ACCOUNT_SID || !parsed.data.TWILIO_AUTH_TOKEN || !parsed.data.TWILIO_WHATSAPP_FROM)
  ) {
    throw new Error(
      "WHATSAPP_PROVIDER=twilio pero faltan TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN o TWILIO_WHATSAPP_FROM. " +
        "Usa WHATSAPP_PROVIDER=none mientras no haya credenciales de Twilio.",
    );
  }

  return parsed.data;
}

// Se evalúa una sola vez, al importar el módulo (arranque del servidor).
export const env = loadEnv();
