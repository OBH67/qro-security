import "server-only";
import { env } from "@/server/config/env";
import { formatearMoneda } from "../plantillas/layout";
import type { CanalNotificacion, FilaOutbox, ResultadoEnvio } from "../tipos";

/**
 * arquitectura.md §7.3: "conectar WhatsApp después no toca nada más que
 * un archivo". Implementación con Twilio (PA-5) — la única fila que hoy
 * se encola con `channel = 'whatsapp'` es `comprobante.recibido` (ver
 * `apartar_pedido()`/0008 y 0013), así que es el único evento con texto
 * propio aquí. Si se conecta Meta Cloud API en vez de Twilio, esa
 * implementación va en este mismo archivo sin tocar el despachador.
 *
 * Se manda con `Body` (texto libre), no con una plantilla de contenido
 * aprobada (`ContentSid`): en el Sandbox de Twilio el texto libre llega
 * sin restricción a cualquier número que ya se haya unido al Sandbox, así
 * que no hace falta crear ni aprobar una plantilla en la consola de
 * Twilio para este aviso interno (solo lo ve la dueña, no un cliente).
 */

function textoComprobanteRecibido(payload: Record<string, unknown>): string {
  const folio = payload.folio as string;
  const total = payload.total as string;
  return (
    `📄 Nuevo comprobante — Pedido ${folio}\n` +
    `Total: ${formatearMoneda(total)}\n` +
    `Entra al panel para revisarlo y confirmar el pago.`
  );
}

const TEXTOS: Partial<Record<string, (payload: Record<string, unknown>) => string>> = {
  "comprobante.recibido": textoComprobanteRecibido,
};

export function crearCanalWhatsapp(): CanalNotificacion {
  return {
    nombre: "whatsapp",
    disponible: () =>
      env.WHATSAPP_PROVIDER === "twilio" &&
      Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_FROM),
    async enviar(fila: FilaOutbox): Promise<ResultadoEnvio> {
      const construirTexto = TEXTOS[fila.event_type];
      if (!construirTexto) {
        return { ok: false, error: `Sin plantilla de WhatsApp para el evento "${fila.event_type}".` };
      }

      const destino = fila.destino.trim();
      if (!destino) {
        return { ok: false, error: "Sin número de WhatsApp configurado (Configuración → Contacto del administrador)." };
      }
      if (!destino.startsWith("+")) {
        return {
          ok: false,
          error: `El número de WhatsApp "${destino}" debe empezar con "+" y la clave del país (ej. "+5214420000000"). Corrígelo en Configuración.`,
        };
      }

      // TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_WHATSAPP_FROM ya están
      // garantizados no nulos aquí — `disponible()` los exige antes de que
      // el despachador elija este canal en vez de `nulo.ts`.
      const accountSid = env.TWILIO_ACCOUNT_SID!;
      const authToken = env.TWILIO_AUTH_TOKEN!;
      const from = env.TWILIO_WHATSAPP_FROM!;

      const cuerpo = new URLSearchParams({
        To: `whatsapp:${destino}`,
        From: from,
        Body: construirTexto(fila.payload),
      });

      const respuesta = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        },
        body: cuerpo,
      });

      if (!respuesta.ok) {
        const detalle = await respuesta.json().catch(() => null);
        return { ok: false, error: `Twilio respondió ${respuesta.status}: ${detalle?.message ?? "error desconocido"}` };
      }
      return { ok: true };
    },
  };
}
