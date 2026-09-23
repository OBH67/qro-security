/**
 * Átomo de carga. No está en `index.html` (el demo estático no puede
 * mostrar un estado "cargando") — está autorizado por
 * `.devsquad/diseno.md` §12.3, que documenta explícitamente los patrones
 * de carga que el HTML de referencia no puede representar.
 */
export function Spinner({ tamano = 18, color = "var(--accent)" }: { tamano?: number; color?: string }) {
  return (
    <span
      role="status"
      aria-label="Cargando"
      style={{
        display: "inline-block",
        width: tamano,
        height: tamano,
        flex: "0 0 auto",
        borderRadius: "50%",
        border: "2px solid transparent",
        borderTopColor: color,
        borderRightColor: color,
        opacity: 0.85,
        animation: "girar 700ms linear infinite",
      }}
    />
  );
}
