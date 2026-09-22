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
        aspectRatio: "3 / 1",
        overflow: "hidden",
        marginBottom: 20,
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: banner.gradient_from ?? "var(--bg-card)",
      }}
    >
      {/* La imagen que sube la dueña siempre viene recortada a franja
          panorámica (~3:1, ver `supabase/seed_dev.sql`) — por eso el
          contenedor fija esa proporción con `aspect-ratio` en vez de una
          altura arbitraria en vw: así el ancho real de la columna de
          productos (`minmax(0,1fr)`, variable según el viewport) siempre
          determina una altura proporcional, sin la franja de fondo vacía
          a los lados que dejaba `object-fit: contain` en un contenedor
          más ancho que la imagen. `cover` tolera además una imagen futura
          que no venga exactamente en 3:1 sin volver a dejar espacio muerto. */}
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
