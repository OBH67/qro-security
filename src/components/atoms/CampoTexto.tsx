import type { InputHTMLAttributes } from "react";

/** Átomo de campo de texto. Borde corregido a `--border-input` (WCAG AA,
 * `diseno.md` §5.3 C-3) en vez del `#1F3244` del demo, que no cumple
 * contraste mínimo como borde funcional de formulario. */
export function CampoTexto(props: InputHTMLAttributes<HTMLInputElement>) {
  const { style, className, ...resto } = props;
  return (
    <input
      {...resto}
      className={className}
      style={{
        width: "100%",
        padding: "11px 14px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-input)",
        borderRadius: "var(--radius-input)",
        color: "var(--text-primary)",
        fontSize: 15,
        ...style,
      }}
    />
  );
}
