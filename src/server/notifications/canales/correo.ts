import "server-only";
import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/server/config/env";
import type { CanalNotificacion, FilaOutbox, ResultadoEnvio, TipoEventoNotificable } from "../tipos";
import { construirComprobanteRecibidoAdmin } from "../plantillas/comprobanteRecibidoAdmin";
import { construirComprobanteRecibidoCliente } from "../plantillas/comprobanteRecibidoCliente";
import { construirPedidoPagoValidado } from "../plantillas/pedidoPagoValidado";
import { construirPedidoEnviado } from "../plantillas/pedidoEnviado";
import { construirPedidoEntregado } from "../plantillas/pedidoEntregado";
import { construirPedidoCancelado } from "../plantillas/pedidoCancelado";
import { construirPedidoPagoRechazado } from "../plantillas/pedidoPagoRechazado";
import { construirServicioSolicitadoAdmin, construirServicioSolicitadoCliente } from "../plantillas/servicioSolicitado";
import { construirDevolucionAprobada } from "../plantillas/devolucionAprobada";
import { construirDevolucionRechazada } from "../plantillas/devolucionRechazada";

type ConstructorPlantilla = (
  payload: Record<string, unknown>,
  admin: SupabaseClient,
) => Promise<{ asunto: string; html: string } | null>;

const PLANTILLAS: Partial<Record<TipoEventoNotificable, ConstructorPlantilla>> = {
  "comprobante.recibido": construirComprobanteRecibidoAdmin,
  "comprobante.recibido.cliente": construirComprobanteRecibidoCliente,
  "pedido.pago_validado": construirPedidoPagoValidado,
  "pedido.enviado": construirPedidoEnviado,
  "pedido.entregado": construirPedidoEntregado,
  "pedido.cancelado": construirPedidoCancelado,
  "pedido.pago_rechazado": construirPedidoPagoRechazado,
  "servicio.solicitado": construirServicioSolicitadoAdmin,
  "servicio.solicitado.cliente": construirServicioSolicitadoCliente,
  "devolucion.aprobada": construirDevolucionAprobada,
  "devolucion.rechazada": construirDevolucionRechazada,
};

/**
 * arquitectura.md §7.2/§7.3 — canal activo desde el día 1. Un archivo de
 * plantilla por evento (mapa de arriba); un evento sin plantilla
 * registrada se marca `fallido` con un mensaje claro en vez de fallar en
 * silencio o reventar el despachador (así un evento nuevo que se encole
 * en SQL antes de tener su plantilla no se pierde, solo queda visible en
 * la bitácora).
 */
export function crearCanalCorreo(admin: SupabaseClient): CanalNotificacion {
  const resend = new Resend(env.RESEND_API_KEY);

  return {
    nombre: "correo",
    disponible: () => Boolean(env.RESEND_API_KEY),
    async enviar(fila: FilaOutbox): Promise<ResultadoEnvio> {
      const construir = PLANTILLAS[fila.event_type as TipoEventoNotificable];
      if (!construir) {
        return { ok: false, error: `Sin plantilla de correo para el evento "${fila.event_type}".` };
      }

      const contenido = await construir(fila.payload, admin);
      if (!contenido) {
        return { ok: false, error: `No se pudo armar el correo del evento "${fila.event_type}" (datos de origen ya no existen).` };
      }

      if (!fila.destino) {
        return { ok: false, error: "Sin destinatario configurado." };
      }

      const { error } = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: fila.destino,
        replyTo: env.EMAIL_REPLY_TO,
        subject: contenido.asunto,
        html: contenido.html,
      });

      if (error) return { ok: false, error: error.message };
      return { ok: true };
    },
  };
}
