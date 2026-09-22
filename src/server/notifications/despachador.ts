import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { crearCanalCorreo } from "./canales/correo";
import { crearCanalWhatsapp } from "./canales/whatsapp";
import { crearCanalNulo } from "./canales/nulo";
import type { CanalId, CanalNotificacion, FilaOutbox } from "./tipos";

const MAX_INTENTOS = 5; // arquitectura.md §7.3: "hasta 5 veces"

function minutosDeEspera(intentos: number): number {
  return Math.pow(2, intentos); // 1, 2, 4, 8, 16 min — espera creciente
}

function canales(): Record<CanalId, CanalNotificacion> {
  const admin = crearClienteAdmin();
  const correo = crearCanalCorreo(admin);
  const whatsapp = crearCanalWhatsapp();
  return {
    correo: correo.disponible() ? correo : crearCanalNulo("correo"),
    whatsapp: whatsapp.disponible() ? whatsapp : crearCanalNulo("whatsapp"),
  };
}

async function procesarFila(admin: ReturnType<typeof crearClienteAdmin>, mapa: Record<CanalId, CanalNotificacion>, fila: FilaOutbox): Promise<void> {
  const canal = mapa[fila.channel];
  const resultado = await canal.enviar(fila);
  const intentos = fila.attempts + 1;

  if (resultado.ok) {
    await admin.from("notification_outbox").update({ status: "enviado", attempts: intentos, sent_at: new Date().toISOString(), last_error: null }).eq("id", fila.id);
    return;
  }

  const agotado = intentos >= MAX_INTENTOS;
  await admin
    .from("notification_outbox")
    .update({
      status: agotado ? "agotado" : "fallido",
      attempts: intentos,
      last_error: resultado.error ?? "Error desconocido",
      next_attempt_at: new Date(Date.now() + minutosDeEspera(intentos) * 60_000).toISOString(),
    })
    .eq("id", fila.id);
}

/**
 * arquitectura.md §7.3, paso 2: "después del commit, el despachador
 * intenta enviar de inmediato". Se llama desde cada mutation justo
 * después de que la función SQL que encoló la(s) fila(s) haya devuelto
 * con éxito — nunca dentro de la transacción SQL (el envío real es un
 * efecto de red, no algo que deba bloquear ni revertir un cambio de
 * estado ya confirmado, criterio C3.2).
 *
 * Por eso esta función NUNCA deja que un error se propague hacia quien
 * la llama: el criterio C3.2 lo decía en el comentario de arriba, pero
 * antes no se cumplía de verdad — no había ningún `try/catch`, así que
 * cualquier falla de esta franja (canal de correo/WhatsApp mal
 * configurado, red caída, hasta un error de import como el módulo
 * `resend` faltante) reventaba hacia arriba y hacía que la acción
 * completa (crear el pedido, confirmar un comprobante, etc.) se
 * reportara como fallida — aunque el cambio de estado ya estuviera
 * comprometido en la base de datos. Se atrapa aquí, se deja constancia
 * en el log del servidor, y listo: las filas de `notification_outbox`
 * se quedan en `pendiente` y las recoge el cron de reintentos
 * (`reintentarNotificacionesVencidas`), así que nada se pierde.
 */
export async function despacharPendientes(): Promise<void> {
  try {
    const admin = crearClienteAdmin();
    const { data: filas } = await admin.from("notification_outbox").select("*").eq("status", "pendiente").limit(50);
    if (!filas || filas.length === 0) return;

    const mapa = canales();
    await Promise.all(filas.map((f) => procesarFila(admin, mapa, f as FilaOutbox)));
  } catch (error) {
    console.error("[despacharPendientes] no se pudo despachar notificaciones pendientes:", error);
  }
}

/** Llamado por `/api/cron/reintentar-notificaciones`: toma lo que quedó
 * `fallido` y cuyo `next_attempt_at` ya pasó. Una fila `pendiente` que el
 * despacho inmediato no alcanzó a procesar (p. ej. la función de Vercel
 * se cortó) también se recoge aquí, sin duplicar envío — sigue en
 * `pendiente` hasta que algún lado la resuelva. */
export async function reintentarNotificacionesVencidas(): Promise<{ procesadas: number }> {
  const admin = crearClienteAdmin();
  const ahora = new Date().toISOString();
  const { data: filas } = await admin
    .from("notification_outbox")
    .select("*")
    .in("status", ["pendiente", "fallido"])
    .lte("next_attempt_at", ahora)
    .limit(100);
  if (!filas || filas.length === 0) return { procesadas: 0 };

  const mapa = canales();
  await Promise.all(filas.map((f) => procesarFila(admin, mapa, f as FilaOutbox)));
  return { procesadas: filas.length };
}
