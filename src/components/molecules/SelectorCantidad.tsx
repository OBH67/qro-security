"use client";

import { useState } from "react";

/** index.html:756-767 — selector de cantidad. Funciona en modo NO
 * controlado (ficha de producto, antes de agregar al carrito: expone la
 * cantidad elegida vía `onChange`) o CONTROLADO (`valor` + `onChange`,
 * carrito — Épica B, `it.onInc`/`it.onDec` de index.html:884-886). */
export function SelectorCantidad({
  maximo,
  valor,
  onChange,
  tamano = "normal",
}: {
  maximo: number;
  valor?: number;
  onChange?: (cantidad: number) => void;
  tamano?: "normal" | "compacto";
}) {
  const [cantidadInterna, setCantidadInterna] = useState(1);
  const cantidad = valor ?? cantidadInterna;
  const enTope = cantidad >= maximo;
  const dimension = tamano === "compacto" ? 44 : 46;

  function cambiar(nueva: number) {
    const acotada = Math.max(1, Math.min(maximo, nueva));
    if (valor === undefined) setCantidadInterna(acotada);
    onChange?.(acotada);
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", width: "fit-content" }}>
        <button
          type="button"
          aria-label="Quitar uno"
          onClick={() => cambiar(cantidad - 1)}
          style={{ width: dimension, height: dimension, fontSize: 18, color: "var(--text-muted)" }}
        >
          −
        </button>
        <span className="font-data" style={{ minWidth: 40, textAlign: "center", fontSize: 15 }}>
          {cantidad}
        </span>
        <button
          type="button"
          aria-label="Agregar uno"
          onClick={() => cambiar(cantidad + 1)}
          style={{ width: dimension, height: dimension, fontSize: 18, color: "var(--text-muted)" }}
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
