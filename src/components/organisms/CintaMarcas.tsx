import type { BrandRow } from "@/types/database";

/** index.html:485-497 — franja de marcas. Se traduce como fila con scroll
 * horizontal en vez del `marquee` animado infinito del demo: es una
 * animación decorativa (no ligada a ningún criterio) y con
 * `prefers-reduced-motion` habría que pausarla de todas formas. */
export function CintaMarcas({ marcas }: { marcas: BrandRow[] }) {
  if (marcas.length === 0) return null;

  return (
    <div style={{ padding: "26px 0", border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
      <span
        style={{
          display: "block",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 18,
        }}
      >
        MARCAS QUE DISTRIBUIMOS
      </span>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "0 20px" }}>
        {marcas.map((marca) => (
          <span
            key={marca.id}
            className="clip-corner-md"
            style={{
              width: 190,
              height: 78,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              border: "1px solid var(--border)",
              background: "var(--bg-card)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 17,
              letterSpacing: "0.06em",
            }}
          >
            {marca.name}
          </span>
        ))}
      </div>
    </div>
  );
}
