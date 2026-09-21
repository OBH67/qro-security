import type { NextConfig } from "next";

// Dominios permitidos para `next/image`. El CDN real (Cloudflare R2, ver
// `.devsquad/arquitectura.md` §7.1) se toma de la variable de entorno
// pública para no hardcodear el dominio de producción aquí. `images.pexels.com`
// es solo para las fotos de muestra de `supabase/seed_dev.sql` (desarrollo).
const dominioR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

function patronDeDominio(url: string) {
  const parsed = new URL(url);
  return {
    protocol: parsed.protocol.replace(":", "") as "http" | "https",
    hostname: parsed.hostname,
    ...(parsed.port ? { port: parsed.port } : {}),
  };
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(dominioR2 ? [patronDeDominio(dominioR2)] : []),
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    // Solo fuera de producción: permite que `NEXT_PUBLIC_R2_PUBLIC_URL`
    // apunte al propio `localhost` en desarrollo (sin cuenta de R2 real,
    // las imágenes de muestra se sirven desde `public/`). Next 16 bloquea
    // por default cualquier imagen remota que resuelva a IP privada
    // (protección SSRF) — en producción el CDN siempre es un dominio
    // público real, así que esta bandera nunca aplica ahí.
    ...(process.env.NODE_ENV !== "production" ? { dangerouslyAllowLocalIP: true } : {}),
  },
};

export default nextConfig;
