import type { EstadoPedido, MetodoPago, MetodoPagoStripe } from "@/types/database";

/** index.html:1895-1896 (`statusIndex`/`statusLabel`) — 5 estados reales +
 * cancelado (hallazgo #15 de `modelo-datos.md`: "Pedido generado" es la
 * fecha de creación, no un estado aparte). Etiqueta GENÉRICA (admin y
 * cliente por igual) — para el cliente, cuando corresponde D-P2 ("Pago
 * recibido" en vez de "Comprobante recibido" en pedidos Stripe), usar
 * `etiquetaEstadoCliente()` en vez de este diccionario directo. */
export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "Pendiente de pago",
  // Épica P (0028/diseño-pagos-stripe.md §1): pago con tarjeta/OXXO/SPEI en
  // curso, esperando el webhook de Stripe — no aparece en PASOS_FLUJO_
  // COMPROBANTE (abajo) a propósito, sigue el mismo criterio que
  // "cancelado": no es un paso del progreso normal del pedido por
  // transferencia, es un estado de espera propio del flujo Stripe (sí
  // aparece en PASOS_FLUJO_STRIPE).
  pago_en_proceso: "Pago en proceso",
  comprobante_recibido: "Comprobante recibido",
  listo_envio: "Listo para envío",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const METODOS_STRIPE: readonly MetodoPagoStripe[] = ["tarjeta", "oxxo", "spei"];

export function esMetodoStripe(metodo: MetodoPago): metodo is MetodoPagoStripe {
  return (METODOS_STRIPE as readonly string[]).includes(metodo);
}

/** D-P2 (diseño-pagos-stripe.md §1/§13, aprobado): el cliente ve "Pago
 * recibido, en revisión" en vez de "Comprobante recibido" cuando pagó con
 * Stripe (tarjeta/OXXO/SPEI) — el admin sigue viendo "Comprobante
 * recibido" (más el chip de método, §6.1, fuera de este incremento). Solo
 * afecta el texto, nunca el color/estado real. */
export function etiquetaEstadoCliente(estado: EstadoPedido, metodo: MetodoPago): string {
  if (estado === "comprobante_recibido" && esMetodoStripe(metodo)) return "Pago recibido, en revisión";
  return ETIQUETA_ESTADO[estado];
}

export interface PasoFlujo {
  estado: EstadoPedido;
  nombre: string;
}

/** Pedido pagado por transferencia con comprobante — sin cambios
 * (diseño-pagos-stripe.md §5.1, fila "Comprobante"). */
export const PASOS_FLUJO_COMPROBANTE: PasoFlujo[] = [
  { estado: "pendiente_pago", nombre: "Pedido generado" },
  { estado: "comprobante_recibido", nombre: "Comprobante recibido" },
  { estado: "listo_envio", nombre: "Listo para envío" },
  { estado: "enviado", nombre: "Enviado" },
  { estado: "entregado", nombre: "Entregado" },
];

/** Pedido pagado con tarjeta/OXXO/SPEI vía Stripe — agrega el paso "Pago en
 * proceso" y renombra el de siempre a "Pago recibido" (diseño-pagos-
 * stripe.md §5.1, fila "Tarjeta / OXXO / SPEI"). Mismo `estado` de base de
 * datos (`comprobante_recibido`) que el flujo de comprobante — el nombre es
 * lo único que cambia, el estado real sigue siendo uno solo (arquitectura
 * §3: "no se crean estados por método"). */
export const PASOS_FLUJO_STRIPE: PasoFlujo[] = [
  { estado: "pendiente_pago", nombre: "Pedido generado" },
  { estado: "pago_en_proceso", nombre: "Pago en proceso" },
  { estado: "comprobante_recibido", nombre: "Pago recibido" },
  { estado: "listo_envio", nombre: "Listo para envío" },
  { estado: "enviado", nombre: "Enviado" },
  { estado: "entregado", nombre: "Entregado" },
];

/** Elige la línea de tiempo según el método del pedido — ambos flujos
 * comparten los mismos 2-3 estados finales, solo difieren en cómo se llega
 * a "Listo para envío". */
export function pasosFlujo(metodo: MetodoPago): PasoFlujo[] {
  return esMetodoStripe(metodo) ? PASOS_FLUJO_STRIPE : PASOS_FLUJO_COMPROBANTE;
}

export function indicePaso(estado: EstadoPedido, metodo: MetodoPago = "transferencia"): number {
  return pasosFlujo(metodo).findIndex((p) => p.estado === estado);
}
