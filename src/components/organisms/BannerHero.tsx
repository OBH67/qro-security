"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { BannerRow } from "@/types/database";
import { urlImagenPublica } from "@/lib/imagenes";

/**
 * index.html:276-338 (solo la mitad izquierda, el carrusel). Simplificado
 * frente al demo: navegación por puntos, sin ciclo automático por
 * temporizador (decorativo, no ligado a ningún criterio de A1-A4) — ver
 * `.devsquad/estado.md`.
 */
export function BannerHero({ banners, grupoSlugPorId }: { banners: BannerRow[]; grupoSlugPorId: Map<string, string> }) {
  const [indice, setIndice] = useState(0);

  if (banners.length === 0) {
    return (
      <section
        style={{
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          padding: "48px 32px",
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(26px,3vw,38px)" }}>Equipo de seguridad electrónica en Querétaro</h1>
        <p style={{ margin: "14px auto 0", maxWidth: "56ch", color: "var(--text-muted)" }}>
          Videovigilancia, control de acceso, automatización, energía, cableado y GPS vehicular.
        </p>
      </section>
    );
  }

  const activo = banners[Math.min(indice, banners.length - 1)];
  const grupoSlug = activo.group_id ? grupoSlugPorId.get(activo.group_id) : undefined;

  return (
    <section
      style={{
        position: "relative",
        border: "1px solid var(--border)",
        background: "var(--bg-surface)",
        overflow: "hidden",
      }}
    >
      <Link
        href={grupoSlug ? `/catalogo/${grupoSlug}` : "#"}
        style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16/9" }}
      >
        <Image
          src={urlImagenPublica(activo.image_url)}
          alt={activo.title}
          fill
          sizes="100vw"
          priority
          style={{ objectFit: "cover" }}
        />
      </Link>
      {banners.length > 1 && (
        <div style={{ position: "absolute", bottom: 16, left: 0, right: 0, display: "flex", gap: 8, justifyContent: "center" }}>
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Banner ${i + 1}: ${b.title}`}
              onClick={() => setIndice(i)}
              style={{
                width: i === indice ? 26 : 9,
                height: 9,
                borderRadius: 999,
                background: i === indice ? "var(--accent)" : "rgba(255,255,255,.4)",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}
