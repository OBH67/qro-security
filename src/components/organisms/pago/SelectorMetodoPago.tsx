"use client";

import type { RefObject } from "react";
import { PaymentElement } from "@stripe/react-stripe-js";
import { OpcionMetodoPago } from "@/components/molecules/OpcionMetodoPago";

/** Los 4 métodos que el cliente ve en el checkout (diseño-pagos-stripe.md
 * §2.2). No es el mismo tipo que `MetodoPago` de `types/database.ts`
 * (valor real de `orders.payment_method`, que usa `"transferencia"` en
 * vez de `"comprobante"`) ni que el `MetodoPago` de
 * `server/pagos/tipos.ts` (registro de estrategias del servidor) — este
 * es puramente de UI, y `"comprobante"` es justo la etiqueta que el
 * cliente ve para esa opción. */
export type MetodoCheckout = "tarjeta" | "oxxo" | "spei" | "comprobante";
export type EstadoFormularioTarjeta = "cargando" | "listo" | "error_carga";

/**
 * diseño-pagos-stripe.md §2.1/§2.2 — grupo de 4 opciones de pago. Orden
 * fijo (Hick: la opción recomendada primero, la más lenta al final):
 * Tarjeta · OXXO · SPEI · Transferencia con comprobante. Tarjeta viene
 * preseleccionada (RN-1). "No se menciona Stripe en las opciones" (§2.3):
 * ningún texto visible dice "Stripe".
 */
export function SelectorMetodoPago({
  metodo,
  onCambiarMetodo,
  deshabilitado,
  oxxoExpiraDias,
  speiExpiraDias,
  estadoFormularioTarjeta,
  errorTarjeta,
  onReintentarCargaTarjeta,
  onCambioPaymentElement,
  onErrorCargaPaymentElement,
  refErrorTarjeta,
}: {
  metodo: MetodoCheckout;
  onCambiarMetodo: (m: MetodoCheckout) => void;
  /** "opciones de pago en solo lectura" mientras se aparta o se procesa
   * (§2.6). */
  deshabilitado: boolean;
  oxxoExpiraDias: number;
  speiExpiraDias: number;
  estadoFormularioTarjeta: EstadoFormularioTarjeta;
  errorTarjeta: string | null;
  onReintentarCargaTarjeta: () => void;
  onCambioPaymentElement?: (listo: boolean) => void;
  /** §2.6 "Stripe no carga" (red, bloqueador de anuncios) — evento
   * `loaderror` del propio Payment Element. */
  onErrorCargaPaymentElement?: () => void;
  /** §11: foco programático al aparecer el banner de tarjeta rechazada. */
  refErrorTarjeta?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <fieldset style={{ border: "none", margin: 0, padding: 0 }} disabled={deshabilitado}>
      {/* §11: el `<fieldset>`/`<legend>` es el requisito de accesibilidad
       * del selector; el título visible ya lo pone el `<h2>` del
       * `CheckoutForm` que envuelve este componente (evita duplicar el
       * mismo texto dos veces en pantalla). */}
      <legend
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
          padding: 0,
        }}
      >
        ¿Cómo quieres pagar?
      </legend>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <OpcionMetodoPago
          id="metodo-tarjeta"
          nombreGrupo="metodo-pago"
          titulo="Tarjeta de crédito o débito"
          subtitulo="Confirmación inmediata"
          seleccionado={metodo === "tarjeta"}
          onSeleccionar={() => onCambiarMetodo("tarjeta")}
        >
          <div style={{ marginTop: 16 }}>
            {errorTarjeta && (
              <div ref={refErrorTarjeta} role="alert" tabIndex={-1} style={{ marginBottom: 14, padding: "14px 16px", border: "1px solid var(--danger)", background: "var(--danger-tint)", outline: "none" }}>
                <p style={{ margin: 0, fontSize: 14, color: "var(--danger-text)" }}>{errorTarjeta}</p>
              </div>
            )}

            {estadoFormularioTarjeta === "error_carga" ? (
              <div style={{ padding: "14px 16px", border: "1px solid var(--danger)", background: "var(--danger-tint)" }}>
                <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--danger-text)" }}>
                  No pudimos cargar el formulario de pago. Revisa tu conexión o desactiva el bloqueador de anuncios e inténtalo de nuevo.
                </p>
                <button type="button" onClick={onReintentarCargaTarjeta} style={{ padding: "8px 14px", border: "1px solid var(--danger-text)", color: "var(--danger-text)", fontSize: 13.5 }}>
                  Reintentar
                </button>
                <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>
                  También puedes pagar por transferencia con comprobante.
                </p>
              </div>
            ) : (
              <>
                {estadoFormularioTarjeta === "cargando" && <EsqueletoFormularioTarjeta />}
                <div style={{ display: estadoFormularioTarjeta === "listo" ? "block" : "none" }}>
                  <PaymentElement
                    id="stripe-payment-element"
                    options={{
                      // Solo tarjeta (`payment_method_types` explícito en
                      // el PaymentIntent, arquitectura §1): sin pestañas
                      // ni bloques de otros métodos (§2.7, `.Tab`/`.Block`
                      // "no se usan"). Nombre y correo van por
                      // `confirmParams` (ya los conocemos de la sesión),
                      // no como campos extra del formulario — el mockup
                      // (§2.1) solo muestra número/vencimiento/CVC.
                      fields: { billingDetails: { name: "never", email: "never" } },
                    }}
                    onReady={() => onCambioPaymentElement?.(true)}
                    onLoadError={() => onErrorCargaPaymentElement?.()}
                  />
                </div>
              </>
            )}
          </div>
        </OpcionMetodoPago>

        <OpcionMetodoPago
          id="metodo-oxxo"
          nombreGrupo="metodo-pago"
          titulo="Efectivo en OXXO"
          subtitulo="Pagas en efectivo en cualquier OXXO. Se confirma hasta 1 día hábil después de pagar"
          seleccionado={metodo === "oxxo"}
          onSeleccionar={() => onCambiarMetodo("oxxo")}
        >
          <NotaMetodoDiferido dias={oxxoExpiraDias} />
        </OpcionMetodoPago>

        <OpcionMetodoPago
          id="metodo-spei"
          nombreGrupo="metodo-pago"
          titulo="Transferencia SPEI (CLABE única para tu pedido)"
          subtitulo="Te damos una CLABE única para este pedido. Se confirma en minutos, sin subir comprobante"
          seleccionado={metodo === "spei"}
          onSeleccionar={() => onCambiarMetodo("spei")}
        >
          <NotaMetodoDiferido dias={speiExpiraDias} />
        </OpcionMetodoPago>

        <OpcionMetodoPago
          id="metodo-comprobante"
          nombreGrupo="metodo-pago"
          titulo="Transferencia con comprobante"
          subtitulo="Nos transfieres y subes la captura. La revisa una persona"
          seleccionado={metodo === "comprobante"}
          onSeleccionar={() => onCambiarMetodo("comprobante")}
        >
          <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>
            Al generar tu pedido te mostramos la CLABE, el concepto y el importe exacto. Subes tu comprobante en Mis pedidos.
          </p>
        </OpcionMetodoPago>
      </div>
    </fieldset>
  );
}

/** §2.2: "Al continuar te mostramos tu ficha de pago. Tienes N días para
 * pagar; mientras tanto apartamos tus productos." — el plazo sale de H4
 * (`oxxo_expires_days`/`spei_expires_days`), nunca fijo en el texto. */
function NotaMetodoDiferido({ dias }: { dias: number }) {
  return (
    <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>
      Al continuar te mostramos tu ficha de pago. Tienes {dias} {dias === 1 ? "día" : "días"} para pagar; mientras tanto apartamos tus productos.
    </p>
  );
}

/** §2.6 "Cargando el formulario de tarjeta": tres rectángulos de esqueleto
 * (número; vencimiento + CVC en dos columnas), fondo `--bg-hover`. */
function EsqueletoFormularioTarjeta() {
  return (
    <div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="sg-salto" style={{ height: 44, background: "var(--bg-hover)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="sg-salto" style={{ height: 44, background: "var(--bg-hover)" }} />
        <div className="sg-salto" style={{ height: 44, background: "var(--bg-hover)" }} />
      </div>
    </div>
  );
}
