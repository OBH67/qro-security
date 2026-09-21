import type { NivelStock } from "@/lib/formato";

/** index.html:2030-2041 — 4 barras + etiqueta de existencias. */
export function IndicadorStock({
  barras,
  etiqueta,
  nivel,
}: {
  barras: boolean[];
  etiqueta: string;
  nivel: NivelStock;
}) {
  const colorBarra =
    nivel === "agotado" ? "var(--track)" : nivel === "bajo" ? "var(--warning)" : "var(--accent)";
  const colorTexto = nivel === "bajo" ? "var(--warning)" : "var(--text-muted)";

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 14 }}>
        {barras.map((activa, i) => (
          <span
            key={i}
            style={{
              width: 4,
              height: 6 + i * 3,
              background: activa ? colorBarra : "var(--track)",
            }}
          />
        ))}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12.5,
          color: colorTexto,
        }}
      >
        {etiqueta}
      </span>
    </div>
  );
}
