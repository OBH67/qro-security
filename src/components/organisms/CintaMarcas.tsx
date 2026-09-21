import type { BrandRow } from "@/types/database";

/**
 * index.html:485-497 — franja de marcas con marquesina infinita
 * (`animation:sgMarquee 34s linear infinite`, keyframe copiado tal cual en
 * `globals.css`). Se duplica la lista de marcas una vez para que el loop
 * de `translateX(-50%)` no deje un hueco — es la misma técnica que usa
 * cualquier marquesina CSS con contenido dinámico; `prefers-reduced-motion`
 * ya la congela por la regla global de `globals.css`.
 */
export function CintaMarcas({ marcas }: { marcas: BrandRow[] }) {
  if (marcas.length === 0) return null;

  const dobles = [...marcas, ...marcas];

  return (
    <div style={{ padding: "26px 0", border: "1px solid #1F3244", background: "#0B1622", overflow: "hidden" }}>
      <span
        style={{
          display: "block",
          textAlign: "center",
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 11,
          color: "#9FB2C3",
          marginBottom: 18,
        }}
      >
        MARCAS QUE DISTRIBUIMOS
      </span>
      <div style={{ display: "flex", gap: 14, width: "max-content", animation: "sgMarquee 34s linear infinite" }}>
        {dobles.map((marca, i) => (
          <span
            key={`${marca.id}-${i}`}
            className="clip-corner-md"
            style={{
              width: 190,
              height: 78,
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              border: "1px solid #1F3244",
              background: "#0F1D2B",
            }}
          >
            <span style={{ fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: "0.06em", color: "#EAF2F8" }}>
              {marca.name}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
