import Image from "next/image";
import type { BannerRow } from "@/types/database";
import { urlImagenPublica } from "@/lib/imagenes";

/** Franja promocional de una página de catálogo (grupo o listado) —
 * mucho más simple que `BannerHero` (el carrusel de portada con reseñas):
 * una sola imagen ancha, sin rotación. Usa `banners` (0006), la misma
 * tabla que ya administra la persona dueña, solo que hasta ahora ningún
 * `/catalogo/*` la mostraba. */
export function BannerCatalogo({ banner }: { banner: BannerRow | null }) {
  if (!banner) return null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "1400/280",
        maxHeight: 280,
        overflow: "hidden",
        marginBottom: 24,
        border: "1px solid var(--border)",
        background: banner.gradient_from ?? "var(--bg-card)",
      }}
    >
      <Image src={urlImagenPublica(banner.image_url)} alt={banner.title} fill sizes="(max-width: 900px) 100vw, 1400px" style={{ objectFit: "cover" }} priority={false} />
      {banner.brand_label && (
        <span
          style={{
            position: "absolute",
            right: 20,
            bottom: 16,
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: 18,
            color: "#fff",
            textShadow: "0 1px 4px rgba(0,0,0,.6)",
          }}
        >
          {banner.brand_label}
        </span>
      )}
    </div>
  );
}
