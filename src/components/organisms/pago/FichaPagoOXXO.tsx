"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatearPrecio, agruparDigitos } from "@/lib/formato";
import { formatearFechaLimite, formatearFechaLimiteEnFrase, venceEnMenosDeSeisHoras, yaVencio } from "@/lib/pagos/fechaLimite";
import { Boton } from "@/components/atoms/Boton";
import { DatoCopiable } from "@/components/molecules/DatoCopiable";

export type EstadoFichaOxxo = "generando" | "lista" | "error_generar";

/**
 * diseño-pagos-stripe.md §3 — "Tu ficha de pago OXXO". Se usa en dos
 * lugares (misma tarjeta, P3.2): la pantalla inmediata después de pulsar
 * "Generar ficha de pago OXXO" en el checkout (`contexto="post-pago"`) y el
 * detalle del pedido en Mis pedidos mientras sigue en `pago_en_proceso`
 * (`contexto="detalle-pedido"`) — la diferencia es solo qué acciones de
 * navegación se muestran, la ficha en sí es idéntica.
 *
 * "Vencida" y "vence en menos de 6h" (dos filas de la tabla de estados de
 * §3) se calculan aquí mismo a partir de `expiresAt`, no como un estado que
 * decida quien llama al componente — un reloj de pared no depende de quién
 * lo mira. Un intervalo de 60s mantiene esas dos condiciones al día si la
 * persona deja la pantalla abierta cruzando esos umbrales.
 */
export function FichaPagoOXXO({
  folio,
  montoCents,
  expiresAt,
  instrucciones,
  estado,
  mensajeError,
  onReintentar,
  contexto,
}: {
  folio: string;
  montoCents: number;
  expiresAt: string | null;
  instrucciones: { referencia: string; urlVoucher: string } | null;
  estado: EstadoFichaOxxo;
  mensajeError?: string | null;
  onReintentar?: () => void;
  contexto: "post-pago" | "detalle-pedido";
}) {
  const [ahora, setAhora] = useState(() => Date.now());
  const [errorAbrir, setErrorAbrir] = useState(false);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  if (estado === "error_generar") {
    return (
      <div style={{ marginTop: 34, padding: 24, border: "1px solid var(--danger)", background: "var(--danger-tint)" }} role="alert">
        <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.55, color: "var(--text-primary)" }}>
          {mensajeError ?? "No pudimos generar tu ficha de OXXO. No se apartaron tus productos ni se hizo ningún cargo."}
        </p>
        {onReintentar && (
          <button type="button" onClick={onReintentar} style={{ padding: "9px 16px", border: "1px solid var(--danger-text)", color: "var(--danger-text)", fontSize: 13.5 }}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const vencida = estado === "lista" && expiresAt ? yaVencio(expiresAt, ahora) : false;
  const venceProto = estado === "lista" && expiresAt && !vencida ? venceEnMenosDeSeisHoras(expiresAt, ahora) : false;

  function abrirFicha() {
    setErrorAbrir(false);
    if (!instrucciones?.urlVoucher) {
      setErrorAbrir(true);
      return;
    }
    const ventana = window.open(instrucciones.urlVoucher, "_blank", "noopener,noreferrer");
    if (!ventana) setErrorAbrir(true);
  }

  return (
    <div style={{ marginTop: 34 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Tu ficha de pago OXXO</h2>

      <div
        style={{
          padding: 28,
          border: "1px solid var(--accent)",
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-glow-primary)",
          opacity: vencida ? 0.4 : 1,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "block", fontSize: 13, letterSpacing: 1.2, color: "var(--text-muted)" }}>MONTO A PAGAR EN CAJA</span>
            <span className="font-data" style={{ display: "block", marginTop: 8, fontSize: 30, fontWeight: 600, color: "var(--accent)" }}>
              {formatearPrecio(montoCents / 100)}
            </span>
          </div>
          {expiresAt && (
            <div>
              <span style={{ display: "block", fontSize: 13, letterSpacing: 1.2, color: "var(--text-muted)" }}>FECHA LÍMITE</span>
              <p style={{ margin: "8px 0 0", fontSize: 18, color: "var(--warning)", display: "flex", gap: 6, alignItems: "center" }}>
                <span aria-hidden="true">⚠</span>
                <time dateTime={expiresAt} className="font-data">
                  {formatearFechaLimite(expiresAt)}
                </time>
              </p>
            </div>
          )}
        </div>

        <div style={{ margin: "22px 0", borderTop: "1px solid var(--border)" }} />

        {estado === "generando" || !instrucciones ? (
          <EsqueletoFicha />
        ) : (
          <>
            <div style={{ background: "var(--voucher-paper)", padding: 20 }}>
              <BarrasDecorativas />
              <p
                className="font-data"
                style={{ margin: "14px 0 0", fontSize: 18, textAlign: "center", color: "var(--voucher-ink)", letterSpacing: 1 }}
              >
                {agruparDigitos(instrucciones.referencia)}
              </p>
            </div>

            <div style={{ marginTop: 18 }}>
              <DatoCopiable
                etiqueta="Referencia"
                valorMostrado={agruparDigitos(instrucciones.referencia)}
                valorCopiar={instrucciones.referencia}
                nombreAccesibleBoton="Copiar referencia"
                mensajeToast="Referencia copiada"
                orientacion="fila"
                tamanoValor={15}
              />
            </div>
          </>
        )}
      </div>

      <div aria-live="polite" className="sr-only">
        {estado === "lista" && instrucciones && !vencida ? "Tu ficha de pago está lista" : ""}
      </div>

      {vencida && (
        <div role="alert" style={{ marginTop: 18, padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>
            Esta ficha venció el {expiresAt ? formatearFechaLimite(expiresAt) : ""} y ya no se puede pagar. No la uses.
          </p>
          <Link href="/pagar" style={{ display: "inline-block", marginTop: 10, fontSize: 13.5, color: "var(--danger-text)" }}>
            Elegir otro método de pago
          </Link>
        </div>
      )}

      {errorAbrir && (
        <p style={{ margin: "14px 0 0", padding: "12px 16px", border: "1px solid var(--warning)", background: "var(--warning-tint)", fontSize: 13.5, color: "var(--text-primary)" }}>
          No pudimos abrir la ficha para imprimir. Puedes pagar dictando la referencia en caja.
        </p>
      )}

      {instrucciones && !vencida && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Boton onClick={abrirFicha}>Descargar / imprimir ficha</Boton>
          {contexto === "post-pago" && (
            <>
              <Boton variante="secundaria" href={`/mi-cuenta/pedidos/${folio}`}>Ver mi pedido</Boton>
              <Link href="/mi-cuenta/pedidos" style={{ alignSelf: "center", fontSize: 14, color: "var(--accent)" }}>
                Ir a Mis pedidos
              </Link>
            </>
          )}
        </div>
      )}

      {!vencida && expiresAt && (
        <div
          style={{
            marginTop: 24,
            padding: "16px 18px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            border: `1px solid ${venceProto ? "var(--warning)" : "var(--processing)"}`,
            background: venceProto ? "var(--warning-tint)" : "var(--processing-tint)",
          }}
        >
          <span aria-hidden="true" style={{ width: 8, height: 8, marginTop: 5, flex: "0 0 auto", background: venceProto ? "var(--warning)" : "var(--processing)" }} />
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-primary)" }}>
            {venceProto
              ? `Tu ficha vence hoy a las ${formatearFechaLimite(expiresAt).split(", ")[1]}. Paga antes o tus productos se liberarán.`
              : `Tus productos quedan apartados hasta el ${formatearFechaLimiteEnFrase(expiresAt)}. Si no pagas antes, se liberan y el pedido se cancela.`}
          </p>
        </div>
      )}

      {contexto === "detalle-pedido" && !vencida && (
        <p style={{ margin: "16px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>
          ¿Ya pagaste? No tienes que hacer nada más. Te avisaremos en cuanto OXXO nos confirme.
        </p>
      )}

      {!vencida && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14, marginTop: 24 }}>
          <PasoNumerado numero="01" titulo="Ve a cualquier OXXO" texto="Muestra el código o dicta la referencia." />
          <PasoNumerado
            numero="02"
            titulo="Paga el monto exacto"
            texto="En efectivo. OXXO cobra una comisión aparte al cliente."
          />
          <PasoNumerado
            numero="03"
            titulo="Te avisamos"
            texto="OXXO nos confirma tu pago hasta 1 día hábil después. Luego lo revisamos y te avisamos por correo."
          />
        </div>
      )}
    </div>
  );
}

function EsqueletoFicha() {
  return (
    <div aria-hidden="true">
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div className="sg-salto" style={{ height: 30, width: 140, background: "var(--bg-hover)" }} />
        <div className="sg-salto" style={{ height: 30, width: 100, background: "var(--bg-hover)" }} />
      </div>
      <div className="sg-salto" style={{ height: 84, background: "rgba(255,255,255,.15)" }} />
      <p style={{ margin: "14px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Generando tu ficha de pago…</p>
    </div>
  );
}

/** Barras puramente decorativas (`aria-hidden`): Stripe no entrega una
 * imagen de código de barras separada de `hosted_voucher_url` (la ficha
 * oficial que se imprime ya trae su propio código) — lo único que este
 * sitio puede mostrar en pantalla es la referencia numérica, que ya cumple
 * el rol accesible ("la referencia también como texto seleccionable",
 * diseño-pagos-stripe.md §11). Estas barras solo refuerzan visualmente que
 * es un código de barras. */
function BarrasDecorativas() {
  const anchos = [3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 3, 1, 2, 4, 1];
  return (
    <div aria-hidden="true" style={{ display: "flex", gap: 2, alignItems: "stretch", height: 64 }}>
      {anchos.map((ancho, i) => (
        <span key={i} style={{ width: ancho, background: "var(--voucher-ink)" }} />
      ))}
    </div>
  );
}

function PasoNumerado({ numero, titulo, texto }: { numero: string; titulo: string; texto: string }) {
  return (
    <div style={{ padding: 18, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
      <span className="font-data" style={{ fontSize: 12, color: "var(--accent)" }}>{numero}</span>
      <h3 style={{ margin: "8px 0 6px", fontSize: 15 }}>{titulo}</h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "var(--text-muted)" }}>{texto}</p>
    </div>
  );
}
