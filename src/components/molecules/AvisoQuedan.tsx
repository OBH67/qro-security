/**
 * diseño-pagos-stripe.md §7 (P8) — etiqueta ámbar sobre la foto del
 * producto, solo cuando quedan 1–2 piezas. Refuerza (no reemplaza) el
 * aviso de texto "¡Quedan X!" que ya pinta `IndicadorStock`: por eso es
 * `aria-hidden` — el nombre accesible de la tarjeta / ficha ya incluye ese
 * texto vía `etiquetaStock`. Debe pintarse dentro de un contenedor con
 * `position: relative` (la foto del producto).
 */
export function AvisoQuedan({ texto }: { texto: string }) {
  return (
    <span
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 10,
        left: 10,
        zIndex: 1,
        padding: "4px 8px",
        background: "var(--warning)",
        color: "#07111C",
        fontFamily: "var(--font-mono)",
        fontWeight: 500,
        fontSize: 11,
        letterSpacing: "1.2px",
        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
      }}
    >
      {texto}
    </span>
  );
}
