import { z } from "zod";

/** C1.1: requiere sesión y dirección completa. El servidor recalcula
 * precios/disponible siempre (B1.4, D3) — este esquema solo valida forma. */
export const esquemaGenerarPedido = z.object({
  addressId: z.uuid("Elige una dirección de envío."),
  wantsInvoice: z.boolean(),
  billingProfileId: z.uuid().optional(),
  agree: z.literal(true, { error: "Confirma la casilla para generar tu pedido." }),
  notes: z.string().trim().max(500).optional(),
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
