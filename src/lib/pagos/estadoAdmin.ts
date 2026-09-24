import type { EstadoPago } from "@/types/database";

/**
 * diseño-pagos-stripe.md §6.2 — "Badge 'Estado en Stripe' (traducción
 * obligatoria, nunca el valor técnico)". Código puro (sin server-only):
 * lo usa tanto el bloque renderizado en servidor como el botón cliente
 * "Consultar estado en Stripe" para comparar la respuesta en vivo contra
 * lo que ya se tenía guardado.
 */
export interface EstiloBadgeEstadoPago {
  label: string;
  color: string;
  relleno: boolean;
}

export const BADGE_ESTADO_PAGO: Record<EstadoPago, EstiloBadgeEstadoPago> = {
  pagado: { label: "Pagado", color: "var(--success)", relleno: false },
  procesando: { label: "En proceso", color: "var(--processing)", relleno: false },
  requiere_accion: { label: "En proceso", color: "var(--processing)", relleno: false },
  iniciado: { label: "En proceso", color: "var(--processing)", relleno: false },
  revision: { label: "Requiere revisión", color: "var(--warning)", relleno: true },
  fallido: { label: "Falló", color: "var(--danger-text)", relleno: false },
  vencido: { label: "Venció", color: "var(--danger-text)", relleno: false },
  cancelado: { label: "Cancelado", color: "var(--text-muted)", relleno: false },
};

/** Traduce el `PaymentIntent.status` CRUDO que regresa Stripe al vuelo
 * (P6.2, "Consultar estado en Stripe") a la misma etiqueta en español que
 * ya usa `BADGE_ESTADO_PAGO`, para poder comparar "lo que Stripe dice
 * ahora" contra "lo que teníamos guardado" sin mostrarle a nadie el valor
 * técnico (`requires_action`, etc.) — ese valor solo se usa aquí adentro
 * para decidir la etiqueta, nunca se imprime. */
export function traducirEstadoStripeCrudo(status: string): string {
  switch (status) {
    case "succeeded":
      return "Pagado";
    case "processing":
    case "requires_action":
    case "requires_confirmation":
    case "requires_capture":
      return "En proceso";
    case "canceled":
      return "Cancelado";
    case "requires_payment_method":
      return "Falló";
    default:
      return status;
  }
}
