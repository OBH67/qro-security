import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";

export interface LimiteConfig {
  maxIntentos: number;
  ventanaMinutos: number;
}

/**
 * arquitectura.md §9.8: límite por IP/correo respaldado en `rate_limits`
 * (0014) — decisión ya tomada en la fase de arquitectura, no de este
 * incremento ("evita un servicio, una cuenta y una llave más que
 * cuidar" frente a un Redis, aceptable al volumen actual).
 *
 * Cuenta los intentos de `key` dentro de `scope` en la ventana dada; si
 * ya se alcanzó el máximo, regresa `false` sin registrar uno nuevo. Si
 * hay margen, registra el intento y regresa `true`. Ante un error de
 * infraestructura (Postgres no responde) se deja pasar — un fallo del
 * limitador nunca debe bloquear a un cliente real (mismo criterio que
 * "una falla de canal nunca bloquea un cambio de estado", C3.2, aplicado
 * aquí a un candado que no protege dinero ni inventario).
 */
export async function intentarConsumirLimite(scope: string, key: string | undefined, config: LimiteConfig): Promise<boolean> {
  if (!key) return true; // sin IP/correo que identificar, no hay a quién limitar

  const admin = crearClienteAdmin();
  const desde = new Date(Date.now() - config.ventanaMinutos * 60_000).toISOString();

  const { count, error } = await admin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("scope", scope)
    .eq("key", key)
    .gte("created_at", desde);

  if (error) return true;
  if ((count ?? 0) >= config.maxIntentos) return false;

  await admin.from("rate_limits").insert({ scope, key });
  return true;
}
