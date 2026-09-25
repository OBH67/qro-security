import type { MetodoPago } from "@/types/database";

const ETIQUETAS: Record<MetodoPago, string> = {
  transferencia: "COMPROBANTE",
  // No está en la enumeración literal de diseño-pagos-stripe.md §6.1
  // (solo lista TARJETA/OXXO/SPEI/COMPROBANTE), pero `saldo_completo` es
  // un método real de RN-11 que también aparece en esta columna — mismo
  // patrón visual (chip neutro), sin inventar color ni forma nueva.
  saldo_completo: "SALDO",
  tarjeta: "TARJETA",
  oxxo: "OXXO",
  spei: "SPEI",
};

/**
 * diseño-pagos-stripe.md §6.1/§9 — chip neutro (`#9FB2C3` contorno, Mono
 * 11 px mayúsculas) para identificar el método de pago en la bandeja de
 * pedidos y en la cabecera del detalle. Nunca se colorea: el color de la
 * fila/estado ya comunica lo que importa (RN-11).
 */
export function ChipMetodoPago({ metodo }: { metodo: MetodoPago }) {
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        fontSize: 11,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        border: "1px solid var(--text-muted)",
        color: "var(--text-muted)",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {ETIQUETAS[metodo]}
    </span>
  );
}
