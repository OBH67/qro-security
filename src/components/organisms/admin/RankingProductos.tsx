"use client";

import { useState } from "react";
import { formatearPrecio } from "@/lib/formato";
import type { OrdenRanking, ProductoRanking } from "@/server/db/queries/admin/analitica";

/** diseño.md §11.12: barras horizontales, un solo color por gráfica
 * ("cian 600 en más vendidos, ámbar en menos vendidos"), con "Ver los
 * datos" para la tabla equivalente (accesibilidad + copiar cifras). */
export function RankingProductos({ titulo, productos, color, orden }: { titulo: string; productos: ProductoRanking[]; color: string; orden: OrdenRanking }) {
  const [verTabla, setVerTabla] = useState(false);
  const maximo = Math.max(1, ...productos.map((p) => (orden === "importe" ? p.importe : p.unidades)));

  return (
    <div className="tarjeta" style={{ padding: 20 }}>
      <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: "0 0 14px" }}>{titulo}</h3>

      {productos.length === 0 && <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin datos para este filtro.</p>}

      {!verTabla &&
        productos.map((p) => {
          const valor = orden === "importe" ? p.importe : p.unidades;
          return (
            <div key={p.sku} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "var(--text-secondary)" }}>{p.nombre}</span>
                <span className="mono">{orden === "importe" ? formatearPrecio(valor) : valor}</span>
              </div>
              <div style={{ background: "var(--track)", height: 8, width: "100%" }}>
                <div style={{ height: "100%", width: `${(valor / maximo) * 100}%`, background: color }} />
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {p.sku} · {formatearPrecio(p.importe)}
              </div>
            </div>
          );
        })}

      {verTabla && productos.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Unidades</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.sku}>
                <td>{p.nombre}</td>
                <td className="mono">{p.sku}</td>
                <td className="mono">{p.unidades}</td>
                <td className="mono">{formatearPrecio(p.importe)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {productos.length > 0 && (
        <button className="btn-fantasma btn-sm" style={{ fontSize: 13, marginTop: 8, border: "none", background: "none", padding: 0, color: "var(--accent)", cursor: "pointer" }} onClick={() => setVerTabla((v) => !v)}>
          {verTabla ? "Ver la gráfica" : "Ver los datos"}
        </button>
      )}
    </div>
  );
}
