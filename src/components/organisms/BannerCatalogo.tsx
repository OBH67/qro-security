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
        height: "clamp(140px, 22vw, 280px)",
        overflow: "hidden",
        marginBottom: 24,
        border: "1px solid var(--border)",
        background: banner.gradient_from ?? "var(--bg-card)",
      }}
    >
      {/* `object-fit: contain` — nunca recorta la imagen real que suba la
          dueña, sin importar su proporción original; el color de fondo
          (`gradient_from`) rellena el espacio sobrante en vez de dejarlo
          en negro. */}
      <Image src={urlImagenPublica(banner.image_url)} alt={banner.title} fill sizes="(max-width: 900px) 100vw, 1400px" style={{ objectFit: "contain" }} priority={false} />
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
