import { z } from "zod";

/** C1.1: requiere sesión y dirección completa. El servidor recalcula
 * precios/disponible siempre (B1.4, D3) — este esquema solo valida forma. */
export const esquemaGenerarPedido = z.object({
  addressId: z.uuid("Elige una dirección de envío."),
  wantsInvoice: z.boolean(),
  billingProfileId: z.uuid().optional(),
  agree: z.literal(true, { error: "Confirma la casilla para generar tu pedido." }),
  notes: z.string().trim().max(500).optional(),
  /** Llave de idempotencia (0011): generada una sola vez en el cliente al
   * entrar a /pagar (CheckoutForm) y reenviada en cada intento mientras el
   * usuario siga en esa pantalla. Obligatoria: sin ella no hay protección
   * real contra doble clic, reintento de red o dos pestañas. */
  idempotencyKey: z.uuid("Falta la llave de idempotencia del pedido."),
  /** D3: cuánto saldo a favor quiere aplicar el cliente a este pedido — el
   * servidor lo vuelve a acotar al subtotal y a lo que el cliente
   * realmente tiene (`crear_pedido()`/`aplicar_saldo()`, RN-7); esto solo
   * valida forma. */
  creditToApply: z.coerce.number().min(0).default(0),
});

export type DatosGenerarPedido = z.infer<typeof esquemaGenerarPedido>;

/** C2.1: los 4 datos que captura el demo al subir el comprobante
 * (index.html:2729, hallazgo #8 de `modelo-datos.md`). Fecha y monto son
 * obligatorios (el demo los muestra sin "(opcional)"); banco de origen y
 * clave SPEI son explícitamente opcionales. */
export const esquemaComprobante = z.object({
  orderId: z.uuid(),
  transferDate: z.iso.date("Escribe la fecha de tu transferencia."),
  amount: z.coerce.number().positive("Escribe el monto que transferiste."),
  originBank: z.string().trim().max(120).optional().or(z.literal("")),
  speiTrackingKey: z.string().trim().max(60).optional().or(z.literal("")),
});

export type DatosComprobante = z.infer<typeof esquemaComprobante>;
