"use client";

import { useState } from "react";
import { Spinner } from "@/components/atoms/Spinner";

/** index.html:756-767 — selector de cantidad. Funciona en modo NO
 * controlado (ficha de producto, antes de agregar al carrito: expone la
 * cantidad elegida vía `onChange`) o CONTROLADO (`valor` + `onChange`,
 * carrito — Épica B, `it.onInc`/`it.onDec` de index.html:884-886).
 * `cargando`: el carrito con sesión espera la respuesta del servidor antes
 * de reflejar la nueva cantidad (sin actualización optimista) — sin este
 * aviso, +/- parecía no hacer nada hasta que la cifra saltaba sola. */
export function SelectorCantidad({
  maximo,
  valor,
  onChange,
  tamano = "normal",
  cargando,
}: {
  maximo: number;
  valor?: number;
  onChange?: (cantidad: number) => void;
  tamano?: "normal" | "compacto";
  cargando?: boolean;
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid var(--border-input)",
          borderRadius: "var(--radius-input)",
          width: "fit-content",
          opacity: cargando ? 0.7 : 1,
          cursor: cargando ? "wait" : undefined,
        }}
      >
        <button
          type="button"
          aria-label="Quitar uno"
          onClick={() => cambiar(cantidad - 1)}
          disabled={cargando}
          style={{ width: dimension, height: dimension, fontSize: 18, color: "var(--text-muted)", cursor: cargando ? "wait" : undefined }}
        >
          −
        </button>
        <span className="font-data" style={{ minWidth: 40, display: "grid", placeItems: "center", fontSize: 15 }}>
          {cargando ? <Spinner tamano={14} color="var(--text-muted)" /> : cantidad}
        </span>
        <button
          type="button"
          aria-label="Agregar uno"
          onClick={() => cambiar(cantidad + 1)}
          disabled={cargando}
          style={{ width: dimension, height: dimension, fontSize: 18, color: "var(--text-muted)", cursor: cargando ? "wait" : undefined }}
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
