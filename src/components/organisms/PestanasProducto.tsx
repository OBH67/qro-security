"use client";

import { useState } from "react";
import type { ProductDocumentRow } from "@/types/database";

type Pestana = "descripcion" | "especificaciones" | "descargas" | "incluye";

const ETIQUETAS: Record<Pestana, string> = {
  descripcion: "Descripción",
  especificaciones: "Ficha técnica",
  descargas: "Descargas",
  incluye: "Qué incluye",
};

/** index.html:783-824 — pestañas de la ficha de producto. La tabla de
 * especificaciones es de pares clave-valor (criterio A3.2, no texto
 * libre): viene de `products.attributes` (JSONB, D1 en `modelo-datos.md`). */
export function PestanasProducto({
  descripcion,
  especificaciones,
  descargas,
  incluye,
}: {
  descripcion: string | null;
  especificaciones: { clave: string; valor: string }[];
  descargas: ProductDocumentRow[];
  incluye: string[];
}) {
  const [activa, setActiva] = useState<Pestana>("descripcion");

  return (
    <div style={{ marginTop: 56, borderTop: "1px solid var(--border)" }}>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: -1 }}>
        {(Object.keys(ETIQUETAS) as Pestana[]).map((clave) => (
          <button
            key={clave}
            type="button"
            onClick={() => setActiva(clave)}
            style={{
              padding: "14px 20px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 15,
              color: activa === clave ? "var(--accent)" : "var(--text-muted)",
              borderTop: `2px solid ${activa === clave ? "var(--accent)" : "transparent"}`,
            }}
          >
            {ETIQUETAS[clave]}
          </button>
        ))}
      </div>

      <div style={{ padding: "28px 0", maxWidth: 820 }}>
        {activa === "descripcion" && (
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: "var(--text-muted)" }}>
            {descripcion ?? "Este producto todavía no tiene descripción capturada."}
          </p>
        )}

        {activa === "especificaciones" &&
          (especificaciones.length === 0 ? (
            <TextoVacio>Este producto todavía no tiene especificaciones técnicas capturadas.</TextoVacio>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15 }}>
              <tbody>
                {especificaciones.map((fila) => (
                  <tr key={fila.clave} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0", color: "var(--text-muted)", width: "40%" }}>{fila.clave}</td>
                    <td className="font-data" style={{ padding: "12px 0", color: "var(--text-primary)", fontSize: 14 }}>
                      {fila.valor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ))}

        {activa === "descargas" &&
          (descargas.length === 0 ? (
            <TextoVacio>Todavía no hay documentos descargables para este producto.</TextoVacio>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {descargas.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 16px", border: "1px solid var(--border)", background: "var(--bg-card)" }}
                >
                  <span style={{ flex: 1, fontSize: 15, color: "var(--text-primary)" }}>{doc.name}</span>
                  <span className="font-data" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {doc.size_bytes ? `${(doc.size_bytes / 1_000_000).toFixed(1)} MB` : ""}
                  </span>
                </a>
              ))}
            </div>
          ))}

        {activa === "incluye" &&
          (incluye.length === 0 ? (
            <TextoVacio>El administrador todavía no capturó qué incluye este producto.</TextoVacio>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10, fontSize: 15.5, color: "var(--text-muted)" }}>
              {incluye.map((item) => (
                <li key={item} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ width: 6, height: 6, background: "var(--accent)", flex: "0 0 auto" }} />
                  {item}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}

function TextoVacio({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, fontSize: 15, color: "var(--text-muted)" }}>{children}</p>;
}
