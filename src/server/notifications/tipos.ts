import "server-only";

/**
 * arquitectura.md §7.3 — interfaz de canal + eventos notificables. Una
 * sola interfaz, varios canales, cero bloqueo (criterio C3.2: la falla de
 * un canal nunca impide que un pedido cambie de estado, porque el cambio
 * de estado ya ocurrió — en la función SQL, dentro de su propia
 * transacción — antes de que exista la fila en `notification_outbox` que
 * este módulo despacha).
 */

export type CanalId = "correo" | "whatsapp";

export type TipoEventoNotificable =
  | "comprobante.recibido" // al admin, con el enlace de confirmación (H3)
  | "comprobante.recibido.cliente" // al cliente, aviso de "lo recibimos" (C2.4)
  | "pedido.enviado"
  | "pedido.cancelado"
  | "pedido.pago_rechazado"
  | "servicio.solicitado" // al admin
  | "servicio.solicitado.cliente"; // confirmación al cliente (E1.5)
// Pendientes de conectar cuando exista quien los dispare (H3 lista 11
// correos; los de aquí son los 5 que hoy tienen un emisor real — ver
// `.devsquad/estado.md`, séptimo incremento): "pedido.generado" (falta
// encolarlo en `crear_pedido()`), "pedido.pago_validado" y
// "devolucion.resuelta" (acciones del panel admin, que no existe
// todavía), "verificacion_cuenta"/"recuperacion_password" (los envía
// Supabase Auth de forma nativa, no pasan por este outbox).

export interface FilaOutbox {
  id: string;
  event_type: string;
  channel: CanalId;
  destino: string;
  payload: Record<string, unknown>;
  status: "pendiente" | "enviado" | "fallido" | "agotado";
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export interface ResultadoEnvio {
  ok: boolean;
  error?: string;
}

/** Cada canal implementa esto. `correo.ts` es el único activo desde el
 * día 1 (Resend); `whatsapp.ts` existe pero `disponible()` regresa
 * `false` mientras PA-5 (número/proveedor) siga sin resolverse —
 * conectarlo de verdad no toca nada más que ese archivo. */
export interface CanalNotificacion {
  readonly nombre: CanalId;
  disponible(): boolean;
  enviar(fila: FilaOutbox): Promise<ResultadoEnvio>;
}
