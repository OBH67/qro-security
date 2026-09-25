"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatearPrecio, agruparDigitos } from "@/lib/formato";
import { formatearFechaLimite, venceEnMenosDeSeisHoras, yaVencio } from "@/lib/pagos/fechaLimite";
import { Boton } from "@/components/atoms/Boton";
import { DatoCopiable } from "@/components/molecules/DatoCopiable";
import { useToast } from "@/components/providers/ToastProvider";

export type EstadoDatosSpei = "generando" | "lista" | "error_generar";

/**
 * diseño-pagos-stripe.md §4 — "Datos para tu pago SPEI". Reutiliza
 * literalmente la estructura de "Datos para transferir" (`DatosTransferencia.tsx`,
 * index.html:1123-1174) que el cliente ya conoce, con las diferencias
 * explícitas del diseño: sin badge DEMO, sin "Subir comprobante ahora"
 * (aquí no se sube nada), "Copiar todos los datos" es la acción primaria, y
 * se agrega "Copiar monto". Misma dualidad de `contexto` que
 * `FichaPagoOXXO` (post-pago / detalle-pedido, P4.2 "los mismos datos
 * quedan en el detalle del pedido").
 */
export function DatosPagoSPEI({
  folio,
  montoCents,
  expiresAt,
  instrucciones,
  estado,
  mensajeError,
  onReintentar,
  contexto,
  pagoParcial,
}: {
  folio: string;
  montoCents: number;
  expiresAt: string | null;
  instrucciones: { clabe: string; banco: string; beneficiario: string; referencia: string } | null;
  estado: EstadoDatosSpei;
  mensajeError?: string | null;
  onReintentar?: () => void;
  contexto: "post-pago" | "detalle-pedido";
  /** P4.4/diseño §4, fila "Pago parcial o de más": Stripe recibió un monto
   * distinto al esperado — el pedido no avanza solo, un asesor lo resuelve.
   * Nulo cuando no aplica (caso normal). */
  pagoParcial?: { recibidoCents: number; esperadoCents: number } | null;
}) {
  const { mostrarToast } = useToast();
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 60_000);
    return () => clearInterval(intervalo);
  }, []);

  if (estado === "error_generar") {
    return (
      <div style={{ marginTop: 34, padding: 24, border: "1px solid var(--danger)", background: "var(--danger-tint)" }} role="alert">
        <p style={{ margin: "0 0 14px", fontSize: 15, lineHeight: 1.55, color: "var(--text-primary)" }}>
          {mensajeError ?? "No pudimos generar tus datos de transferencia. No se apartaron tus productos."}
        </p>
        {onReintentar && (
          <button type="button" onClick={onReintentar} style={{ padding: "9px 16px", border: "1px solid var(--danger-text)", color: "var(--danger-text)", fontSize: 13.5 }}>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  const vencida = expiresAt ? yaVencio(expiresAt, ahora) : false;
  const venceProto = expiresAt && !vencida ? venceEnMenosDeSeisHoras(expiresAt, ahora) : false;

  async function copiarTodo() {
    if (!instrucciones) return;
    const texto = [
      `Banco: ${instrucciones.banco}`,
      `Beneficiario: ${instrucciones.beneficiario}`,
      `CLABE: ${instrucciones.clabe}`,
      `Referencia: ${instrucciones.referencia}`,
      `Importe: ${formatearPrecio(montoCents / 100)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast("Datos copiados");
    } catch {
      mostrarToast("Selecciona y copia manualmente");
    }
  }

  return (
    <div style={{ marginTop: 34 }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Datos para tu pago SPEI</h2>

      <div style={{ padding: 28, border: "1px solid var(--accent)", background: "var(--bg-card)", boxShadow: "var(--shadow-glow-primary)", opacity: vencida ? 0.4 : 1 }}>
        {estado === "generando" || !instrucciones ? (
          <EsqueletoDatos />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <FilaDato label="Banco" valor={instrucciones.banco || "—"} />
              <FilaDato label="Beneficiario" valor={instrucciones.beneficiario || "—"} />
            </div>

            <div style={{ margin: "22px 0", borderTop: "1px solid var(--border)" }} />

            <DatoCopiable
              etiqueta="CLABE interbancaria (única para este pedido)"
              valorMostrado={agruparDigitos(instrucciones.clabe)}
              valorCopiar={instrucciones.clabe}
              nombreAccesibleBoton="Copiar CLABE"
              mensajeToast="CLABE copiada"
              tamanoValor="clamp(18px,2.2vw,24px)"
              letterSpacing={1}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20, marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
              <DatoCopiable
                etiqueta="Referencia"
                valorMostrado={instrucciones.referencia || "—"}
                valorCopiar={instrucciones.referencia}
                nombreAccesibleBoton="Copiar referencia"
                mensajeToast="Referencia copiada"
                tamanoValor={20}
              />
              <div>
                <span style={{ display: "block", fontSize: 14, color: "var(--text-muted)" }}>Importe exacto a transferir</span>
                <span className="font-data" style={{ display: "block", marginTop: 8, fontSize: 30, fontWeight: 600, color: "var(--accent)" }}>
                  {formatearPrecio(montoCents / 100)}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(String(montoCents / 100));
                      mostrarToast("Monto copiado");
                    } catch {
                      mostrarToast("Selecciona y copia manualmente");
                    }
                  }}
                  aria-label="Copiar monto"
                  style={{ marginTop: 10, padding: "8px 14px", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 13 }}
                >
                  Copiar monto
                </button>
              </div>
            </div>

            {expiresAt && (
              <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--warning)", display: "flex", gap: 6, alignItems: "center" }}>
                <span aria-hidden="true">⚠</span>
                Transfiere antes del{" "}
                <time dateTime={expiresAt} className="font-data">
                  {formatearFechaLimite(expiresAt)}
                </time>
              </p>
            )}
          </>
        )}
      </div>

      {pagoParcial && !vencida && (
        <div role="alert" style={{ marginTop: 18, padding: "14px 18px", border: "1px solid var(--warning)", background: "var(--warning-tint)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
            Recibimos {formatearPrecio(pagoParcial.recibidoCents / 100)} y tu pedido es de {formatearPrecio(pagoParcial.esperadoCents / 100)}. Lo estamos
            revisando; te contactaremos para resolverlo.
          </p>
        </div>
      )}

      {vencida && (
        <div role="alert" style={{ marginTop: 18, padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
          <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>Esta CLABE venció el {expiresAt ? formatearFechaLimite(expiresAt) : ""}. No transfieras a ella.</p>
          <Link href="/pagar" style={{ display: "inline-block", marginTop: 10, fontSize: 13.5, color: "var(--danger-text)" }}>
            Elegir otro método de pago
          </Link>
        </div>
      )}

      {instrucciones && !vencida && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <Boton onClick={copiarTodo}>Copiar todos los datos</Boton>
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

      {!vencida && instrucciones && (
        <div style={{ marginTop: 24, padding: "16px 18px", border: "1px solid var(--warning)", background: "var(--warning-tint)" }}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-primary)" }}>
            {venceProto
              ? `Tu CLABE vence hoy a las ${expiresAt ? formatearFechaLimite(expiresAt).split(", ")[1] : ""}.`
              : "Transfiere el importe exacto. Si envías una cantidad distinta, tu pedido no avanza hasta que lo revisemos."}
          </p>
        </div>
      )}

      {!vencida && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 14, marginTop: 24 }}>
          <PasoNumerado numero="01" titulo="Copia la CLABE" texto="Es solo para este pedido." />
          <PasoNumerado numero="02" titulo="Transfiere desde tu banco" texto="Por el importe exacto, antes de la fecha límite." />
          <PasoNumerado numero="03" titulo="Te avisamos" texto="SPEI se confirma en minutos. No tienes que subir comprobante." />
        </div>
      )}
    </div>
  );
}

function FilaDato({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: "flex", gap: 16, justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
      <span className="font-data" style={{ fontSize: 15, color: "var(--text-primary)" }}>{valor}</span>
    </div>
  );
}

function EsqueletoDatos() {
  return (
    <div aria-hidden="true">
      <div className="sg-salto" style={{ height: 20, width: "60%", background: "var(--bg-hover)", marginBottom: 14 }} />
      <div className="sg-salto" style={{ height: 20, width: "50%", background: "var(--bg-hover)", marginBottom: 22 }} />
      <div className="sg-salto" style={{ height: 30, width: "80%", background: "var(--bg-hover)" }} />
      <p style={{ margin: "14px 0 0", fontSize: 14, color: "var(--text-muted)" }}>Generando tu CLABE…</p>
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
