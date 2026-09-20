import type { CSSProperties } from "react";

/**
 * Átomo de etiqueta corta (badge). Uso principal en el catálogo: marcar un
 * producto reingresado como "Usado" (D6, `modelo-datos.md`). El color de
 * "Usado" viene de `diseno.md` §2.1 ("Atención, plazo por vencer, 'Usado'"
 * → `--warning`), que documenta el significado semántico del token, no solo
 * su uso dentro del panel admin.
 */

type Tono = "neutro" | "advertencia" | "exito" | "peligro" | "acento";

const COLOR: Record<Tono, string> = {
  neutro: "var(--text-muted)",
  advertencia: "var(--warning)",
  exito: "var(--success)",
  peligro: "var(--danger-text)",
  acento: "var(--accent)",
};

export function Etiqueta({
  children,
  tono = "neutro",
  style,
}: {
  children: React.ReactNode;
  tono?: Tono;
  style?: CSSProperties;
}) {
  const color = COLOR[tono];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        border: `1px solid ${color}`,
        color,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      {children}
    </span>
  );
}
