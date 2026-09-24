import "server-only";
import type { EstrategiaPago, MetodoPago } from "./tipos";
import { estrategiaComprobante } from "./estrategias/comprobante";
import { estrategiaTarjeta } from "./estrategias/tarjeta";
import { estrategiaOxxo } from "./estrategias/oxxo";
import { estrategiaSpei } from "./estrategias/spei";

/** arquitectura-pagos-stripe.md §2: el checkout, "Mis pedidos", la
 * bandeja de admin y el cron hablan solo con este registro — nunca
 * importan una estrategia directo ni ramifican por método. */
const REGISTRO: Record<MetodoPago, EstrategiaPago> = {
  comprobante: estrategiaComprobante,
  tarjeta: estrategiaTarjeta,
  oxxo: estrategiaOxxo,
  spei: estrategiaSpei,
};

export function obtenerEstrategia(metodo: MetodoPago): EstrategiaPago {
  const estrategia = REGISTRO[metodo];
  if (!estrategia) throw new Error(`Método de pago no soportado: ${metodo}`);
  return estrategia;
}

export function metodosDisponibles(): MetodoPago[] {
  return Object.keys(REGISTRO) as MetodoPago[];
}
