import type { EstadoPedido } from "@/types/database";

/** index.html:1895-1896 (`statusIndex`/`statusLabel`) — 5 estados reales +
 * cancelado (hallazgo #15 de `modelo-datos.md`: "Pedido generado" es la
 * fecha de creación, no un estado aparte). */
export const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "Pendiente de pago",
  comprobante_recibido: "Comprobante recibido",
  listo_envio: "Listo para envío",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

export const PASOS_FLUJO: { estado: EstadoPedido; nombre: string }[] = [
  { estado: "pendiente_pago", nombre: "Pedido generado" },
  { estado: "comprobante_recibido", nombre: "Comprobante recibido" },
  { estado: "listo_envio", nombre: "Listo para envío" },
  { estado: "enviado", nombre: "Enviado" },
  { estado: "entregado", nombre: "Entregado" },
];

export function indicePaso(estado: EstadoPedido): number {
  return PASOS_FLUJO.findIndex((p) => p.estado === estado);
}
