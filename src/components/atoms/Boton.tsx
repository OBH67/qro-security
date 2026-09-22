import type { AnchorHTMLAttributes, ButtonHTMLAttributes, CSSProperties } from "react";
import Link from "next/link";

/**
 * Átomo de botón. No sabe nada de negocio — recibe estilo y contenido
 * (arquitectura.md §4.1). Traduce los tres tratamientos que se repiten en
 * `index.html`: sólido cian (acción principal), contorno cian (secundaria)
 * y deshabilitado. El corte diagonal (`clip-path`) es el elemento de marca
 * heredado del demo — ver `globals.css` `.clip-corner-*`.
 */

type Variante = "primaria" | "secundaria" | "fantasma" | "deshabilitada";
type Tamano = "sm" | "md" | "lg";

const PADDING: Record<Tamano, string> = {
  sm: "10px 16px",
  md: "12px 20px",
  lg: "15px 26px",
};

const CLIP_CLASS: Record<Tamano, string> = {
  sm: "clip-corner-sm",
  md: "clip-corner-md",
  lg: "clip-corner-lg",
};

function estiloVariante(variante: Variante): CSSProperties {
  switch (variante) {
    case "primaria":
      return {
        background: "var(--accent)",
        color: "var(--bg-base)",
        boxShadow: "var(--shadow-glow-primary)",
      };
    case "secundaria":
      return {
        background: "transparent",
        color: "var(--accent)",
        border: "1px solid var(--accent)",
      };
    case "fantasma":
      return { background: "transparent", color: "var(--accent)" };
    case "deshabilitada":
    default:
      return {
        background: "var(--bg-hover)",
        color: "var(--text-disabled)",
        cursor: "not-allowed",
      };
  }
}

interface PropsComunes {
  variante?: Variante;
  tamano?: Tamano;
  anchoCompleto?: boolean;
  sinCorte?: boolean;
  className?: string;
  children: React.ReactNode;
}

type PropsBoton = PropsComunes &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type PropsEnlace = PropsComunes &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Boton(props: PropsBoton | PropsEnlace) {
  const {
    variante = "primaria",
    tamano = "md",
    anchoCompleto,
    sinCorte,
    className,
    children,
    style,
    ...resto
  } = props;

  // El HTML `disabled` y el estilo visual eran dos cosas independientes:
  // un `<Boton disabled={condicion} onClick={...}>` (patrón usado en ~20
  // pantallas — formularios, "Generar pedido", "Agregar al carrito", el
  // login) sí quedaba sin poder darle clic, pero seguía pintado con el
  // color sólido de `variante="primaria"` (el default) porque
  // `estiloVariante` solo miraba la prop `variante`, nunca si el botón
  // en realidad estaba deshabilitado — parecía activo aunque no lo
  // estuviera. Ahora cualquier botón deshabilitado (por `disabled` o por
  // `variante="deshabilitada"` explícito) siempre se ve con el estilo
  // gris/apagado, sin que cada pantalla tenga que acordarse de pasar las
  // dos props a la vez.
  const estaDeshabilitado = variante === "deshabilitada" || Boolean(("disabled" in resto && resto.disabled));

  const estiloBase: CSSProperties = {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: PADDING[tamano],
    minHeight: 44,
    fontFamily: "var(--font-display)",
    fontWeight: 600,
    fontSize: tamano === "sm" ? 14 : tamano === "lg" ? 16 : 14.5,
    width: anchoCompleto ? "100%" : undefined,
    ...estiloVariante(estaDeshabilitado ? "deshabilitada" : variante),
    ...style,
  };

  const claseCorte = sinCorte ? "" : CLIP_CLASS[tamano];
  const clases = [claseCorte, className].filter(Boolean).join(" ");

  if ("href" in props && props.href) {
    const { href, ...anchorResto } = resto as AnchorHTMLAttributes<HTMLAnchorElement> & {
      href: string;
    };
    return (
      <Link href={href} className={clases} style={estiloBase} {...anchorResto}>
        {children}
      </Link>
    );
  }

  const boton = resto as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      type={boton.type ?? "button"}
      className={clases}
      style={estiloBase}
      disabled={estaDeshabilitado}
      {...boton}
    >
      {children}
    </button>
  );
}
