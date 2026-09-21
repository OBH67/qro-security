"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { actualizarPrecioAction } from "@/server/actions/admin/catalogo";
import { formatearPrecio } from "@/lib/formato";
import type { FilaProductoAdmin } from "@/server/db/queries/admin/catalogo";

const ETIQUETA_ESTADO: Record<string, { label: string; estilo: React.CSSProperties }> = {
  activo: { label: "Activo", estilo: { background: "transparent", border: "1px solid var(--success)", color: "var(--success)" } },
  agotado: { label: "Agotado", estilo: { background: "transparent", border: "1px solid var(--warning)", color: "var(--warning)" } },
  descontinuado: { label: "Baja", estilo: { background: "transparent", border: "1px solid var(--text-dim)", color: "var(--text-dim)" } },
};

/** panel-admin-maqueta.html:527-556 — tabla del catálogo con edición
 * rápida de precio (doble clic, líneas 538-545). */
export function TablaCatalogoAdmin({ productos }: { productos: FilaProductoAdmin[] }) {
  const router = useRouter();
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(id: string) {
    setGuardando(true);
    const resultado = await actualizarPrecioAction(id, Number(valor));
    setGuardando(false);
    if (resultado.ok) {
      setEditandoId(null);
      router.refresh();
    }
  }

  return (
    <div className="tarjeta">
      <table>
        <thead>
          <tr>
            <th>Foto</th>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Marca</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => {
            const est = ETIQUETA_ESTADO[p.status];
            return (
              <tr key={p.id} className="fila">
                <td>
                  <div style={{ width: 36, height: 36, background: "var(--bg-hover)", border: "1px solid var(--border)", display: "grid", placeItems: "center", fontSize: 10, color: "var(--text-dim)" }} className="mono">
                    {p.sku.slice(-4)}
                  </div>
                </td>
                <td className="mono">
                  {p.sku}
                  {p.condition !== "nuevo" && (
                    <div>
                      <span className="badge" style={{ background: "transparent", border: "1px solid var(--warning)", color: "var(--warning)", marginTop: 4 }}>
                        {p.condition === "usado" ? "Usado" : "Caja abierta"}
                      </span>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{p.conditionDetail}</div>
                    </div>
                  )}
                </td>
                <td>
                  <Link href={`/admin/catalogo/${p.id}`} style={{ color: "inherit" }}>
                    {p.name}
                  </Link>
                </td>
                <td style={{ color: "var(--text-muted)" }}>{p.marca ?? "—"}</td>
                <td className="mono">
                  {editandoId === p.id ? (
                    <input
                      className="campo"
                      style={{ height: 32, width: 100 }}
                      value={valor}
                      autoFocus
                      onChange={(e) => setValor(e.target.value)}
                      onBlur={() => guardar(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") guardar(p.id);
                        if (e.key === "Escape") setEditandoId(null);
                      }}
                      disabled={guardando}
                    />
                  ) : (
                    <span
                      onDoubleClick={() => {
                        setEditandoId(p.id);
                        setValor(p.price);
                      }}
                      style={{ cursor: "pointer", borderBottom: "1px dashed var(--text-dim)" }}
                      title="Doble clic para editar"
                    >
                      {formatearPrecio(p.price)}
                    </span>
                  )}
                </td>
                <td className="mono">{p.condition !== "nuevo" ? "1 (única)" : p.stock}</td>
                <td>
                  <span className="badge" style={est.estilo}>
                    {est.label}
                  </span>
                </td>
              </tr>
            );
          })}
          {productos.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                No hay productos que coincidan con este filtro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
