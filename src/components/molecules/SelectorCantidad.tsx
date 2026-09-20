"use client";

import { useState } from "react";

/** index.html:756-767 — selector de cantidad de la ficha de producto.
 * Estado solo local: todavía no hay carrito al que sumarlo (Épica B,
 * siguiente incremento) — ver `.devsquad/estado.md`. */
export function SelectorCantidad({ maximo }: { maximo: number }) {
  const [cantidad, setCantidad] = useState(1);
  const enTope = cantidad >= maximo;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", width: "fit-content" }}>
        <button
          type="button"
          aria-label="Quitar uno"
          onClick={() => setCantidad((c) => Math.max(1, c - 1))}
          style={{ width: 46, height: 46, fontSize: 20, color: "var(--text-muted)" }}
        >
          −
        </button>
        <span className="font-data" style={{ minWidth: 44, textAlign: "center", fontSize: 16 }}>
          {cantidad}
        </span>
        <button
          type="button"
          aria-label="Agregar uno"
          onClick={() => setCantidad((c) => Math.min(maximo, c + 1))}
          style={{ width: 46, height: 46, fontSize: 20, color: "var(--text-muted)" }}
        >
          +
        </button>
      </div>
      {enTope && (
        <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--warning)" }}>Solo hay {maximo} piezas.</p>
      )}
    </div>
  );
}
