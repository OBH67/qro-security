"use client";

import { useState, useTransition } from "react";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import { DatoCopiable } from "@/components/molecules/DatoCopiable";
import { formatearPrecio } from "@/lib/formato";
import { agruparDigitos } from "@/lib/formato";
import { formatearFechaLimite } from "@/lib/pagos/fechaLimite";
import { BADGE_ESTADO_PAGO } from "@/lib/pagos/estadoAdmin";
import { consultarEstadoPagoStripeAction } from "@/server/actions/admin/pedidos";
import { useEstadoPagoStripeAdminOpcional } from "@/components/providers/EstadoPagoStripeAdminProvider";
import type { EstadoPago, InstruccionesPago, MetodoPagoStripe } from "@/types/database";

const TITULO_POR_METODO: Record<MetodoPagoStripe, string> = {
  tarjeta: "Pago con tarjeta",
  oxxo: "Pago en OXXO",
  spei: "Transferencia SPEI",
};

function formatearFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * diseño-pagos-stripe.md §6.2 — organismo `DetallePagoStripe`: toda la
 * información técnica de un pago con Stripe, visible SOLO en el panel
 * admin (nunca al cliente). Sustituye a `VisorComprobante` en el mismo
 * lugar de la columna izquierda cuando `pedido.payment_method` es
 * tarjeta/oxxo/spei — un pedido nunca tiene comprobante Y pago de Stripe.
 */
export function DetallePagoStripe({
  orderId,
  metodo,
  status,
  stripePaymentIntentId,
  amountCents,
  amountReceivedCents,
  cardBrand,
  cardLast4,
  expiresAt,
  instructions,
  updatedAt,
  urlStripeDashboard,
  pedidoEnProceso,
}: {
  orderId: string;
  metodo: MetodoPagoStripe;
  status: EstadoPago;
  stripePaymentIntentId: string | null;
  amountCents: number;
  amountReceivedCents: number | null;
  cardBrand: string | null;
  cardLast4: string | null;
  expiresAt: string | null;
  instructions: InstruccionesPago | null;
  updatedAt: string;
  urlStripeDashboard: string | null;
  /** §6.4 "Pedido en 'Pago en proceso'": el admin abrió el detalle desde el
   * filtro antes de que Stripe confirme — bloque reducido, sin "Consultar"
   * ni datos de fallo/decline (no hay nada que consultar todavía salvo el
   * plazo). */
  pedidoEnProceso: boolean;
}) {
  const ctx = useEstadoPagoStripeAdminOpcional();
  const [isPending, startTransition] = useTransition();
  const [consulta, setConsulta] = useState<{
    estadoTraducido: string;
    coincide: boolean;
    declineCode: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    consultadoEn: string;
  } | null>(null);
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null);

  const badgeGuardado = BADGE_ESTADO_PAGO[status];
  const montoRecibidoCents = amountReceivedCents ?? amountCents;
  // §6.2: "al terminar [de consultar], actualiza el badge" — mientras no se
  // haya consultado, se muestra el último estado que guardó el webhook.
  const badgeMostrado = consulta ? { label: consulta.estadoTraducido, ...estiloPorEtiquetaTraducida(consulta.estadoTraducido) } : badgeGuardado;

  function consultar() {
    setErrorConsulta(null);
    startTransition(async () => {
      const resultado = await consultarEstadoPagoStripeAction(orderId, metodo, badgeGuardado.label);
      if (!resultado.ok) {
        setErrorConsulta(resultado.error);
        return;
      }
      setConsulta(resultado.data);
      ctx?.setInconsistencia(
        resultado.data.coincide
          ? null
          : `Stripe dice «${resultado.data.estadoTraducido}», pero aquí teníamos «${badgeGuardado.label}». No valides este pago hasta aclararlo.`,
      );
    });
  }

  if (pedidoEnProceso) {
    return (
      <div className="tarjeta" style={{ padding: 18 }}>
        <h3 style={tituloEstilo}>{TITULO_POR_METODO[metodo]}</h3>
        <span className="badge" style={{ border: `1px solid ${badgeGuardado.color}`, color: badgeGuardado.color, background: "transparent" }}>
          {badgeGuardado.label}
        </span>
        {expiresAt && (
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--warning)" }}>
            <span aria-hidden="true">⚠ </span>Vence {formatearFechaLimite(expiresAt)}
          </div>
        )}
        <p style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-secondary)" }}>
          El cliente aún no termina de pagar. Este pedido llegará a tu bandeja cuando Stripe confirme el pago.
        </p>
      </div>
    );
  }

  return (
    <div className="tarjeta" style={{ padding: 18 }}>
      <h3 style={tituloEstilo}>{TITULO_POR_METODO[metodo]}</h3>

      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Estado en Stripe</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          className="badge"
          style={
            badgeMostrado.relleno
              ? { background: badgeMostrado.color, color: "#07111C" }
              : { border: `1px solid ${badgeMostrado.color}`, color: badgeMostrado.color, background: "transparent" }
          }
        >
          {badgeMostrado.label}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {consulta ? "Consultado hace un momento" : `Actualizado ${formatearFechaHora(updatedAt)}`}
        </span>
      </div>
      <div aria-live="polite" className="sr-only">
        {consulta && `Estado en Stripe: ${consulta.estadoTraducido}`}
      </div>

      <div style={{ marginTop: 10 }}>
        <BotonAdmin variante="secundario" tamano="sm" onClick={consultar} cargando={isPending} textoCargando="Consultando…">
          Consultar estado en Stripe
        </BotonAdmin>
      </div>
      {errorConsulta && (
        <div role="alert" style={{ marginTop: 10, padding: "10px 14px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)", fontSize: 13 }}>
          No pudimos comunicarnos con Stripe. El estado mostrado es el último que recibimos ({formatearFechaHora(updatedAt)}). {errorConsulta}
        </div>
      )}
      {consulta && !consulta.coincide && (
        <div role="alert" style={{ marginTop: 10, padding: "10px 14px", border: "1px solid var(--warning)", background: "var(--warning-tint)", fontSize: 13, color: "var(--text-primary)" }}>
          Stripe dice «{consulta.estadoTraducido}», pero aquí teníamos «{badgeGuardado.label}». No valides este pago hasta aclararlo.
        </div>
      )}
      {consulta?.declineCode && (
        <div style={{ marginTop: 10, padding: "10px 14px", border: "1px solid var(--border)", background: "var(--bg-inset)", fontSize: 12.5 }}>
          <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>Detalle técnico del rechazo (solo visible aquí)</div>
          <div className="mono">
            decline_code: {consulta.declineCode} · code: {consulta.failureCode ?? "—"}
          </div>
          {consulta.failureMessage && <div style={{ marginTop: 4, color: "var(--text-secondary)" }}>{consulta.failureMessage}</div>}
        </div>
      )}

      <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 14 }}>
        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
          {metodo === "tarjeta" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>Tarjeta</dt>
              <dd className="mono" style={{ margin: 0 }} aria-label={cardLast4 ? `Tarjeta ${cardBrand ?? ""} terminada en ${cardLast4}` : undefined}>
                {cardBrand ? cardBrand.toUpperCase() : "—"} {cardLast4 ? `•••• ${cardLast4}` : ""}
              </dd>
            </div>
          )}
          {metodo === "oxxo" && instructions?.metodo === "oxxo" && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>Referencia OXXO</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {agruparDigitos(instructions.referencia)}
              </dd>
            </div>
          )}
          {metodo === "spei" && instructions?.metodo === "spei" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-muted)" }}>CLABE</dt>
                <dd className="mono" style={{ margin: 0 }}>
                  {agruparDigitos(instructions.clabe)}
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <dt style={{ color: "var(--text-muted)" }}>Referencia</dt>
                <dd className="mono" style={{ margin: 0 }}>
                  {instructions.referencia}
                </dd>
              </div>
            </>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <dt style={{ color: "var(--text-muted)" }}>Fecha de pago</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {formatearFechaHora(updatedAt)}
            </dd>
          </div>
          {expiresAt && (metodo === "oxxo" || metodo === "spei") && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <dt style={{ color: "var(--text-muted)" }}>Fecha límite que tenía</dt>
              <dd className="mono" style={{ margin: 0 }}>
                {formatearFechaLimite(expiresAt)}
              </dd>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <dt style={{ color: "var(--text-muted)" }}>Monto recibido</dt>
            <dd className="mono" style={{ margin: 0 }}>
              {formatearPrecio(montoRecibidoCents / 100)}
            </dd>
          </div>
        </dl>

        {stripePaymentIntentId && (
          <div style={{ marginTop: 14 }}>
            <DatoCopiable
              etiqueta="ID de pago"
              valorMostrado={stripePaymentIntentId}
              valorCopiar={stripePaymentIntentId}
              nombreAccesibleBoton="Copiar ID de pago"
              mensajeToast="ID de pago copiado"
              tamanoValor={13}
              orientacion="fila"
            />
          </div>
        )}
        {urlStripeDashboard && (
          <div style={{ marginTop: 10 }}>
            <a href={urlStripeDashboard} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--accent)" }}>
              Ver este pago en Stripe ↗<span className="sr-only"> (abre Stripe en una pestaña nueva)</span>
            </a>
          </div>
        )}
      </div>

      {status === "pagado" && (
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14, fontSize: 12.5, color: "var(--text-muted)", display: "flex", gap: 6 }}>
          <span aria-hidden="true">ⓘ</span>
          <span>Stripe ya cobró este pago. Si lo rechazas, el monto se abona al cliente como saldo a favor.</span>
        </div>
      )}
    </div>
  );
}

/** Traduce la misma etiqueta corta que ya regresó `traducirEstadoStripeCrudo()`
 * a un color — solo cuatro valores posibles (Pagado/En proceso/Cancelado/
 * Falló), mismos tokens que `BADGE_ESTADO_PAGO`. */
function estiloPorEtiquetaTraducida(label: string): { color: string; relleno: boolean } {
  switch (label) {
    case "Pagado":
      return { color: "var(--success)", relleno: false };
    case "En proceso":
      return { color: "var(--processing)", relleno: false };
    case "Cancelado":
      return { color: "var(--text-muted)", relleno: false };
    case "Falló":
      return { color: "var(--danger-text)", relleno: false };
    default:
      return { color: "var(--text-muted)", relleno: false };
  }
}

const tituloEstilo: React.CSSProperties = {
  fontFamily: "var(--font-title)",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: 0.5,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  margin: "0 0 10px",
};
