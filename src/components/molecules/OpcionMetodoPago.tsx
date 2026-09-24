"use client";

import type { ReactNode } from "react";

/**
 * diseño-pagos-stripe.md §2.2 — tarjeta de opción del selector de método de
 * pago (checkout). Cada instancia es un `<input type="radio">` real
 * (visualmente oculto) envuelto en un `<label>` que cubre toda la tarjeta
 * (Fitts: toda la tarjeta es el área de clic, no solo el radio) — los cuatro
 * comparten `name="metodo-pago"` así que las flechas del teclado ya cambian
 * de opción sin JS adicional (comportamiento nativo de un grupo de radios).
 *
 * Estados (tabla §2.2): seleccionada / no seleccionada / hover (solo no
 * seleccionada, vía CSS) / deshabilitada. Cuando está deshabilitada, la
 * segunda línea se reemplaza por el motivo en ámbar con ⚠ (P1.6).
 */
export function OpcionMetodoPago({
  id,
  nombreGrupo,
  titulo,
  subtitulo,
  seleccionado,
  deshabilitado,
  motivoDeshabilitado,
  onSeleccionar,
  children,
}: {
  id: string;
  nombreGrupo: string;
  titulo: string;
  subtitulo: ReactNode;
  seleccionado: boolean;
  deshabilitado?: boolean;
  motivoDeshabilitado?: string;
  onSeleccionar: () => void;
  /** Contenido que se expande debajo del texto SOLO cuando esta opción está
   * seleccionada (Payment Element para tarjeta, nota de 2 líneas para
   * OXXO/SPEI, texto de comprobante) — §2.2 "solo la opción seleccionada
   * se expande". */
  children?: ReactNode;
}) {
  const idMotivo = `${id}-motivo`;

  return (
    <div className="opcion-metodo-pago-wrap">
      <label
        htmlFor={id}
        className="opcion-metodo-pago"
        data-seleccionado={seleccionado || undefined}
        data-deshabilitado={deshabilitado || undefined}
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 18,
          minHeight: 64,
          gap: 12,
          cursor: deshabilitado ? "not-allowed" : "pointer",
          border: deshabilitado
            ? "1px dashed var(--border-strong)"
            : seleccionado
              ? "1px solid var(--accent)"
              : "1px solid var(--border)",
          background: deshabilitado ? "var(--bg-inset)" : seleccionado ? "var(--accent-tint)" : "var(--bg-card)",
        }}
      >
        <span style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <input
            type="radio"
            id={id}
            name={nombreGrupo}
            checked={seleccionado}
            disabled={deshabilitado}
            onChange={onSeleccionar}
            aria-describedby={deshabilitado && motivoDeshabilitado ? idMotivo : undefined}
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
          />
          <span
            aria-hidden="true"
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              flex: "0 0 auto",
              marginTop: 3,
              border: `1px solid ${deshabilitado ? "var(--border-strong)" : seleccionado ? "var(--accent)" : "var(--border-input)"}`,
              boxShadow: seleccionado && !deshabilitado ? "inset 0 0 0 4px var(--bg-base), inset 0 0 0 10px var(--accent)" : "none",
            }}
          />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 16,
                color: deshabilitado ? "var(--text-disabled)" : "var(--text-primary)",
              }}
            >
              {titulo}
            </span>
            {deshabilitado && motivoDeshabilitado ? (
              <span id={idMotivo} style={{ display: "flex", gap: 6, marginTop: 4, fontSize: 14, color: "var(--warning)" }}>
                <span aria-hidden="true">⚠</span>
                {motivoDeshabilitado}
              </span>
            ) : (
              <span style={{ display: "block", marginTop: 4, fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>{subtitulo}</span>
            )}
          </span>
        </span>
        {seleccionado && !deshabilitado && children ? <span style={{ marginTop: 4 }}>{children}</span> : null}
      </label>
      <style>{`
        .opcion-metodo-pago:hover:not([data-seleccionado]):not([data-deshabilitado]) {
          border-color: var(--border-strong) !important;
          background: var(--bg-hover) !important;
        }
        .opcion-metodo-pago:has(input:focus-visible) {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
