"use client";

import { useEffect } from "react";

/** Límite de error de toda la aplicación — cubre fallas que ocurren antes
 * de llegar al layout del sitio público (ej. la navegación del encabezado,
 * que se resuelve en `(public)/layout.tsx`). Mismo criterio de mensaje que
 * `.devsquad/diseno.md` §12.4. */
export default function ErrorRaiz({
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        padding: 20,
        textAlign: "center",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 28 }}>No pudimos cargar el sitio</h1>
      <p style={{ margin: 0, color: "var(--text-secondary)", maxWidth: 480 }}>
        Algo falló al conectar con nuestros servidores. Intenta de nuevo en un momento.
      </p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: "12px 22px",
          background: "var(--accent)",
          color: "var(--bg-base)",
          fontFamily: "var(--font-display)",
          fontWeight: 600,
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
