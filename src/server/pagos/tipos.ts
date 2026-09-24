import "server-only";
import type { InstruccionesPago } from "@/types/database";

/**
 * Patrón Strategy (arquitectura-pagos-stripe.md §2): tarjeta, oxxo, spei y
 * comprobante implementan la misma interfaz, para que el checkout,
 * "Mis pedidos", la bandeja de admin y el cron los traten de forma
 * uniforme sin `if (metodo === ...)` repartidos por el código. Agregar un
 * método nuevo es otra estrategia que reutiliza `PasarelaStripe`
 * (`stripe/pasarela.ts`), sin tocar las demás (abierto/cerrado).
 */
export type MetodoPago = "comprobante" | "tarjeta" | "oxxo" | "spei";

/** Pedido ya creado (`pendiente_pago`) al que se le va a iniciar un
 * intento de pago — lo mínimo que toda estrategia necesita para arrancar. */
export interface PedidoParaPago {
  id: string;
  folio: string;
  userId: string;
  userEmail: string;
  userNombre: string;
  /** `orders.total` ya neto de saldo aplicado (P1.3: "con saldo aplicado
   * se cobra solo la diferencia") convertido a centavos. */
  totalCents: number;
}

/** Datos específicos de método que el checkout ya recogió antes de llamar
 * a `iniciar()`. Cada estrategia solo lee los campos que le aplican. */
export interface CtxPago {
  /** UUID generado por el cliente al entrar al paso de pago — mismo
   * patrón que `orders.idempotency_key` (0011): un reintento con la misma
   * llave nunca duplica el apartado ni el intento de pago. */
  idempotencyKey: string;
  /** Solo comprobante: el archivo que el cliente va a subir. */
  archivo?: { nombreArchivo: string; contentType: string };
}

export type InicioPago =
  | { tipo: "subir_archivo"; urlFirmada: string; key: string }
  | { tipo: "payment_element"; clientSecret: string; paymentIntentId: string };

export interface DetallePagoRevision {
  metodo: MetodoPago;
  montoCents: number;
  fecha: string;
  estado: string;
  cardBrand?: string | null;
  cardLast4?: string | null;
  urlStripeDashboard?: string | null;
  paymentIntentId?: string | null;
}

export interface EstadoProveedor {
  status: string;
  raw: unknown;
}

export interface EstrategiaPago {
  metodo: MetodoPago;
  /** Minutos de vigencia del apartado para ESTE intento (30 para tarjeta,
   * días configurables × 1440 para OXXO/SPEI). `null` cuando el método no
   * tiene una vigencia propia por intento (comprobante: la gobierna el
   * cron de 3 días de PA-7, no un timeout de Stripe). */
  vigenciaApartado(ctx: CtxPago): Promise<number | null>;
  iniciar(pedido: PedidoParaPago, ctx: CtxPago): Promise<InicioPago>;
  instrucciones?(pedidoId: string): Promise<InstruccionesPago | null>;
  detalleRevision(pedidoId: string): Promise<DetallePagoRevision | null>;
  verificarEnProveedor?(pedidoId: string): Promise<EstadoProveedor | null>;
}
