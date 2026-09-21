import Link from "next/link";
import type { ReviewRow } from "@/types/database";

/** index.html:298-321 — columna de reseñas de la portada, traducción
 * literal (colores exactos del demo). Estado vacío autorizado por
 * `diseno.md` §12.3 (estados que el HTML estático no puede mostrar). Las
 * reseñas ya son datos reales (`reviews`, marcadas `published = true`),
 * no el contenido fijo del demo. */
export function PanelResenas({ reseñas }: { reseñas: ReviewRow[] }) {
  return (
    <div
      style={{
        flex: "1 1 330px",
        minWidth: 0,
        maxWidth: 440,
        display: "flex",
        flexDirection: "column",
        border: "1px solid #1F3244",
        borderRadius: 14,
        background: "#0B1622",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "15px 18px", borderBottom: "1px solid #16283A" }}>
        <span style={{ fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 16, color: "#EAF2F8" }}>Opiniones de clientes</span>
        <Link href="/como-comprar" style={{ fontSize: 13, color: "#3CE7FF" }}>
          Ver todas
        </Link>
      </div>
      <div style={{ flex: 1, overflowY: "auto", maxHeight: 420 }}>
        {reseñas.length === 0 ? (
          <p style={{ padding: 18, fontSize: 14, color: "#9FB2C3" }}>Todavía no hay opiniones publicadas.</p>
        ) : (
          reseñas.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, padding: "15px 18px", borderBottom: "1px solid #16283A" }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  background: "#16283A",
                  border: "1px solid #1F3244",
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 12,
                  color: "#3CE7FF",
                }}
              >
                {iniciales(r.author_name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12.5, color: "#9FB2C3" }}>
                  <span style={{ color: "#EAF2F8", fontWeight: 600 }}>{r.author_name}</span>
                  {r.category && (
                    <>
                      <span>·</span>
                      <span>{r.category}</span>
                    </>
                  )}
                </div>
                <div style={{ marginTop: 4, fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, letterSpacing: 2, color: "#3CE7FF" }}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
                <p style={{ margin: "7px 0 0", fontSize: 14, lineHeight: 1.5, color: "#C7D5E0" }}>
                  {r.title && <span style={{ color: "#EAF2F8", fontWeight: 600 }}>{r.title} — </span>}
                  {r.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function iniciales(nombre: string): string {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
