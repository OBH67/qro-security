import Link from "next/link";

/**
 * index.html:692-696 — controles de paginación. A diferencia del demo (que
 * hardcodea 3 páginas), aquí `totalPaginas` viene de un `count` real de la
 * base de datos (criterio A1.5). Es 100 % enlaces `<a>` — funciona sin JS y
 * mantiene el resto de filtros en la URL (criterio A4).
 */
export function Paginacion({
  paginaActual,
  totalPaginas,
  construirHref,
}: {
  paginaActual: number;
  totalPaginas: number;
  construirHref: (pagina: number) => string;
}) {
  if (totalPaginas <= 1) return null;

  const ventana = 2;
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPaginas || Math.abs(n - paginaActual) <= ventana,
  );

  const estiloBoton = (activa: boolean): React.CSSProperties => ({
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    border: `1px solid ${activa ? "var(--accent)" : "var(--border)"}`,
    color: activa ? "var(--accent)" : "var(--text-muted)",
    fontFamily: "var(--font-mono)",
    fontSize: 14,
  });

  let ultimaPintada = 0;

  return (
    <nav
      aria-label="Paginación de resultados"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 36,
        flexWrap: "wrap",
      }}
    >
      {paginaActual > 1 && (
        <Link href={construirHref(paginaActual - 1)} style={estiloBoton(false)} aria-label="Página anterior">
          ‹
        </Link>
      )}
      {paginas.map((n) => {
        const salto = n - ultimaPintada > 1;
        ultimaPintada = n;
        return (
          <span key={n} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {salto && <span style={{ color: "var(--text-muted)" }}>…</span>}
            <Link
              href={construirHref(n)}
              aria-current={n === paginaActual ? "page" : undefined}
              style={estiloBoton(n === paginaActual)}
            >
              {n}
            </Link>
          </span>
        );
      })}
      {paginaActual < totalPaginas && (
        <Link
          href={construirHref(paginaActual + 1)}
          style={{ ...estiloBoton(false), width: "auto", padding: "0 16px" }}
        >
          Siguiente
        </Link>
      )}
    </nav>
  );
}
