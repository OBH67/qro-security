"use client";

import { useEffect } from "react";
import { Boton } from "@/components/atoms/Boton";

/**
 * Límite de error del sitio público. No está en `index.html` (el HTML
 * estático no puede mostrar un error real) — autorizado por
 * `.devsquad/diseno.md` §12.4 (plantilla de mensaje de error: qué pasó,
 * por qué, qué hacer, sin tecnicismos en pantalla).
 */
export default function ErrorSitioPublico({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "90px 20px", textAlign: "center" }}>
      <h1 style={{ margin: 0, fontSize: "clamp(24px,2.6vw,32px)" }}>No pudimos cargar esta página</h1>
      <p style={{ margin: "14px 0 0", color: "var(--text-muted)", lineHeight: 1.6 }}>
        Algo falló al conectar con nuestro catálogo. Puede ser temporal — intenta de nuevo en un momento.
      </p>
      <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Boton onClick={reset} variante="primaria">
          Reintentar
        </Boton>
        <Boton href="/" variante="secundaria">
          Volver al inicio
        </Boton>
      </div>
    </section>
  );
}
