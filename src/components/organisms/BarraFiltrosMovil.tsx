"use client";

import { useState } from "react";
import { SelectOrden } from "@/components/molecules/SelectOrden";
import type { OrdenCatalogo } from "@/lib/constantes";

/**
 * index.html:596 ("Filtros y orden") + index.html:600/2402 (`filterPanelStyle`,
 * el cajón deslizante de abajo en móvil) — con un ajuste explícito pedido
 * por la dueña que el demo no cubre: este disparador es `position:sticky`,
 * así que al hacer scroll hacia abajo (una vez que el encabezado principal
 * ya salió de vista — es `position:relative`, EncabezadoSitio.tsx) esta
 * barra queda pegada arriba con solo el acceso a filtros/orden, sin el
 * resto del encabezado. Al volver al inicio de la página el encabezado
 * completo vuelve a estar a la vista de forma natural (flujo normal, sin
 * JS). Solo visible en móvil — ver `.filtros-barra-movil` en
 * `ListadoCatalogo.tsx`.
 */
export function BarraFiltrosMovil({
  children,
  resultados,
  ordenActual,
  className,
}: {
  children: React.ReactNode;
  resultados: number;
  ordenActual: OrdenCatalogo;
  className?: string;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className={className} style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg-base)", paddingTop: 10, paddingBottom: 10 }}>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        style={{
          width: "100%",
          padding: 14,
          border: "1px solid var(--accent)",
          color: "var(--accent)",
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: 15,
        }}
      >
        Filtros y orden
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          style={{ position: "fixed", inset: 0, zIndex: 95, background: "rgba(7,17,28,.7)" }}
          onClick={() => setAbierto(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              maxHeight: "70vh",
              overflowY: "auto",
              background: "var(--bg-surface)",
              borderTop: "1px solid var(--accent)",
              padding: "22px 18px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 19 }}>Filtros</span>
              <button type="button" onClick={() => setAbierto(false)} style={{ padding: "10px 16px", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 14 }}>
                Ver {resultados} resultado{resultados === 1 ? "" : "s"}
              </button>
            </div>
            <div style={{ paddingBottom: 20, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
              <SelectOrden ordenActual={ordenActual} />
            </div>
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
