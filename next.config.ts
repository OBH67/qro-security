import type { NextConfig } from "next";

// Dominios permitidos para `next/image`. El CDN real (Cloudflare R2, ver
// `.devsquad/arquitectura.md` §7.1) se toma de la variable de entorno
// pública para no hardcodear el dominio de producción aquí. `images.pexels.com`
// es solo para las fotos de muestra de `supabase/seed_dev.sql` (desarrollo).
const dominioR2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(dominioR2
        ? [{ protocol: "https" as const, hostname: new URL(dominioR2).hostname }]
        : []),
      { protocol: "https", hostname: "images.pexels.com" },
    ],
  },
};

export default nextConfig;
