"use client";

import { useState } from "react";
import Image from "next/image";
import type { ProductImageRow } from "@/types/database";
import { urlImagenPublica } from "@/lib/imagenes";

/** index.html:712-728 — galería de la ficha de producto: foto grande +
 * miniaturas. Sin fotos reales todavía (catálogo por cargar, PA-20), se
 * muestra el mismo placeholder con el SKU y las esquinas del demo. */
export function GaleriaProducto({ sku, nombre, imagenes }: { sku: string; nombre: string; imagenes: ProductImageRow[] }) {
  const [activa, setActiva] = useState(0);
  const imagenActiva = imagenes[activa];

  return (
    <div>
      <div
        style={{
          position: "relative",
          aspectRatio: "1",
          background: "#E7EDF2",
          overflow: "hidden",
          display: "grid",
          placeItems: "center",
          padding: 36,
        }}
      >
        {imagenActiva ? (
          <Image
            src={urlImagenPublica(imagenActiva.url)}
            alt={imagenActiva.alt ?? nombre}
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            style={{ objectFit: "cover", mixBlendMode: "luminosity", opacity: 0.85 }}
          />
        ) : (
          <span style={{ position: "relative", fontFamily: "var(--font-mono)", fontSize: 11, color: "#3a4a58", textAlign: "center", lineHeight: 1.6, background: "rgba(231,237,242,.75)", padding: "6px 10px" }}>
            {sku}
          </span>
        )}
        <EsquinaDecorativa posicion="top-left" />
        <EsquinaDecorativa posicion="top-right" />
        <EsquinaDecorativa posicion="bottom-left" />
        <EsquinaDecorativa posicion="bottom-right" />
      </div>

      {imagenes.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginTop: 10 }}>
          {imagenes.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActiva(i)}
              aria-label={`Foto ${i + 1}`}
              aria-current={i === activa}
              style={{
                position: "relative",
                aspectRatio: "1",
                display: "grid",
                placeItems: "center",
                background: "#E7EDF2",
                border: `1px solid ${i === activa ? "var(--accent)" : "transparent"}`,
                boxShadow: i === activa ? "0 0 12px rgba(60,231,255,.35)" : "none",
                overflow: "hidden",
              }}
            >
              <Image src={urlImagenPublica(img.url)} alt="" fill sizes="80px" style={{ objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EsquinaDecorativa({ posicion }: { posicion: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const arriba = posicion.startsWith("top");
  const izquierda = posicion.endsWith("left");
  const borde = "1.5px solid var(--accent)";
  return (
    <span
      style={{
        position: "absolute",
        top: arriba ? 12 : undefined,
        bottom: arriba ? undefined : 12,
        left: izquierda ? 12 : undefined,
        right: izquierda ? undefined : 12,
        width: 22,
        height: 22,
        borderTop: arriba ? borde : undefined,
        borderBottom: arriba ? undefined : borde,
        borderLeft: izquierda ? borde : undefined,
        borderRight: izquierda ? undefined : borde,
      }}
    />
  );
}
