"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface EstadoPagoStripeContexto {
  /** diseño-pagos-stripe.md §6.2: "Si el estado consultado NO coincide con
   * el que teníamos, banner ámbar... y 'Validar pago' se deshabilita." El
   * bloque `DetallePagoStripe` (columna izquierda) escribe aquí; el botón
   * "Validar pago" de `AccionesPedido` (columna derecha, componente
   * hermano) lo lee — es el único puente entre los dos sin subir estado a
   * la página, que es un Server Component y no puede tener `useState`. */
  inconsistencia: string | null;
  setInconsistencia: (mensaje: string | null) => void;
}

const Contexto = createContext<EstadoPagoStripeContexto | null>(null);

export function EstadoPagoStripeAdminProvider({ children }: { children: ReactNode }) {
  const [inconsistencia, setInconsistencia] = useState<string | null>(null);
  return <Contexto.Provider value={{ inconsistencia, setInconsistencia }}>{children}</Contexto.Provider>;
}

/** Componentes que pueden renderizarse tanto dentro como fuera del
 * proveedor (p. ej. `AccionesPedido`, compartido por el flujo de
 * comprobante y el de Stripe) usan esta variante en vez de lanzar. */
export function useEstadoPagoStripeAdminOpcional(): EstadoPagoStripeContexto | null {
  return useContext(Contexto);
}
