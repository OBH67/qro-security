/**
 * Cálculos de dinero del carrito y el checkout. Código puro (arquitectura
 * §4, regla de dependencia #2) — los precios ya incluyen IVA (RN-2), aquí
 * solo se suma, nunca se recalcula el impuesto.
 */

export interface ItemParaTotal {
  price: number;
  qty: number;
}

export function calcularSubtotal(items: ItemParaTotal[]): number {
  return items.reduce((acc, it) => acc + it.price * it.qty, 0);
}

/** Saldo aplicado nunca excede el subtotal ni el saldo disponible del
 * cliente (RN-7); el servidor vuelve a validar esto dentro de
 * `crear_pedido()` — aquí solo se refleja la misma regla para mostrarla en
 * pantalla antes de confirmar. */
export function calcularCreditoAplicable(subtotal: number, saldoDisponible: number, creditoDeseado: number): number {
  return Math.max(0, Math.min(creditoDeseado, subtotal, saldoDisponible));
}

export function calcularTotalConSaldo(subtotal: number, creditoAplicado: number): number {
  return Math.max(0, subtotal - creditoAplicado);
}
