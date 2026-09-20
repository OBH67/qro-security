/**
 * Resuelve la URL pública de una imagen de producto. En la base de datos
 * `product_images.url`/`banners.image_url` guardan la **clave del objeto en
 * R2**, nunca una URL completa (arquitectura.md §7.1) — el CDN se antepone
 * aquí, en un solo lugar.
 *
 * Los datos de desarrollo (`supabase/seed_dev.sql`) sí guardan URLs
 * absolutas de imágenes de muestra; se respetan tal cual para no
 * duplicar el dominio del CDN encima de ellas.
 */
export function urlImagenPublica(clave: string): string {
  if (/^https?:\/\//.test(clave)) return clave;
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "";
  return `${base.replace(/\/$/, "")}/${clave.replace(/^\//, "")}`;
}
