import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variante = "primario" | "secundario" | "fantasma" | "peligro" | "peligro-lleno";

const COLOR_SPINNER: Record<Variante, string> = {
  primario: "var(--bg-base)",
  "peligro-lleno": "#07111C",
  secundario: "var(--accent)",
  fantasma: "var(--text-muted)",
  peligro: "var(--danger-text)",
};

/**
 * Equivalente de `Boton` (átomos del sitio público) para el panel admin,
 * que usa las clases `.btn .btn-*` de `admin.css` en vez del átomo del
 * sitio — mismo contrato de `cargando`/`textoCargando` (diseño.md §12.3).
 */
export function BotonAdmin({
  variante = "primario",
  tamano,
  cargando,
  textoCargando,
  className,
  children,
  disabled,
  ...resto
}: {
  variante?: Variante;
  tamano?: "sm";
  cargando?: boolean;
  textoCargando?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const clases = ["btn", `btn-${variante}`, tamano === "sm" ? "btn-sm" : "", cargando ? "btn-cargando" : "", className].filter(Boolean).join(" ");
  return (
    <button className={clases} disabled={disabled || cargando} aria-busy={cargando || undefined} {...resto}>
      {cargando && <Spinner tamano={14} color={COLOR_SPINNER[variante]} />}
      {cargando ? (textoCargando ?? children) : children}
    </button>
  );
}
