import Image from "next/image";
import type { BrandRow } from "@/types/database";
import { urlImagenPublica } from "@/lib/imagenes";

/**
 * index.html:485-497 — franja de marcas con marquesina infinita
 * (`animation:sgMarquee 34s linear infinite`, keyframe copiado tal cual en
 * `globals.css`). Se duplica la lista de marcas una vez para que el loop
 * de `translateX(-50%)` no deje un hueco — es la misma técnica que usa
 * cualquier marquesina CSS con contenido dinámico; `prefers-reduced-motion`
 * ya la congela por la regla global de `globals.css`.
 *
 * Logos reales (2026-09-22): antes esta franja siempre mostraba una caja
 * con el NOMBRE de la marca en texto — nunca hubo logos (PA-13,
 * `modelo-datos.md` §7, seguía abierta: no había catálogo de marcas
 * confirmado). Ahora que `brands.logo_url` trae la URL real del logo, se
 * muestra la imagen; el texto queda solo como respaldo para una marca sin
 * logo cargado (o mientras la imagen no ha cargado, vía `alt`).
 */
export function CintaMarcas({ marcas }: { marcas: BrandRow[] }) {
  if (marcas.length === 0) return null;

  const dobles = [...marcas, ...marcas];

  return (
    <div
      style={{
        padding: "26px 0",
        border: "1px solid #1F3244",
        background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%), #0B1622",
        overflow: "hidden",
      }}
    >
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
              position: "relative",
              width: 190,
              height: 78,
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              border: "1px solid rgba(255,255,255,0.42)",
              background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(244,248,252,0.96) 52%, rgba(231,239,247,0.92) 100%)",
              boxShadow: "0 14px 28px rgba(3,10,18,0.18)",
            }}
          >
            {marca.logo_url ? (
              <Image
                src={urlImagenPublica(marca.logo_url)}
                alt={marca.name}
                fill
                sizes="190px"
                style={{ objectFit: "contain", padding: "14px 18px" }}
              />
            ) : (
              <span style={{ fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: "0.06em", color: "#102133" }}>
                {marca.name}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
