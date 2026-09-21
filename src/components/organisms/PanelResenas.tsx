import type { ReviewRow } from "@/types/database";

/** index.html:298-321 — columna de reseñas de la portada. Estado vacío
 * autorizado por `diseno.md` §12.3 (estados que el HTML estático no puede
 * mostrar). PA-14 (`modelo-datos.md` §7) sigue abierta sobre si son
 * reseñas reales moderadas o contenido curado; aquí solo se lee lo que ya
 * esté marcado `published = true`. */
export function PanelResenas({ reseñas }: { reseñas: ReviewRow[] }) {
  return (
    <div
      style={{
        flex: "1 1 330px",
        minWidth: 0,
        maxWidth: 440,
        display: "flex",
        flexDirection: "column",
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "15px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16 }}>Opiniones de clientes</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", maxHeight: 420 }}>
        {reseñas.length === 0 ? (
          <p style={{ padding: 18, fontSize: 14, color: "var(--text-muted)" }}>
            Todavía no hay opiniones publicadas.
          </p>
        ) : (
          reseñas.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: 12, padding: "15px 18px", borderBottom: "1px solid var(--border-subtle)" }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  flex: "0 0 auto",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--accent)",
                }}
              >
                {iniciales(r.author_name)}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", fontSize: 12.5, color: "var(--text-muted)" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.author_name}</span>
                  {r.category && (
                    <>
                      <span>·</span>
                      <span>{r.category}</span>
                    </>
                  )}
                </div>
                <div style={{ marginTop: 4, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: 2, color: "var(--accent)" }}>
                  {"★".repeat(r.rating)}
                  {"☆".repeat(5 - r.rating)}
                </div>
                <p style={{ margin: "7px 0 0", fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>
                  {r.title && <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{r.title} — </span>}
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
