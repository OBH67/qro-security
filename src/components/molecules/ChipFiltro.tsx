import Link from "next/link";

/** index.html:626-631 — chip de filtro activo, con botón de quitar. */
export function ChipFiltro({ etiqueta, href }: { etiqueta: string; href: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "6px 12px",
        background: "var(--accent-wash)",
        border: "1px solid var(--accent)",
        color: "var(--accent)",
        fontSize: 13,
      }}
    >
      {etiqueta}
      <span style={{ fontSize: 15, lineHeight: 1 }} aria-hidden="true">
        ×
      </span>
      <span className="sr-only">Quitar filtro {etiqueta}</span>
    </Link>
  );
}
