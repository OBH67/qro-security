import { z } from "zod";

/** D1.2: producto(s), cantidad, condición declarada por partida — el
 * motivo general es único por solicitud (una devolución puede incluir
 * varias partidas del mismo pedido). */
export const esquemaSolicitarDevolucion = z.object({
  orderId: z.uuid("Elige el pedido del que quieres devolver algo."),
  reason: z.string().trim().min(1, "Cuéntanos por qué quieres devolverlo."),
  items: z
    .array(
      z.object({
        orderItemId: z.uuid(),
        qty: z.coerce.number().int().positive("La cantidad debe ser al menos 1."),
        condition: z.enum(["sellado", "abierto", "otro"], { error: "Elige la condición del producto." }),
      }),
    )
    .min(1, "Elige al menos un producto a devolver."),
});

export type DatosSolicitarDevolucion = z.infer<typeof esquemaSolicitarDevolucion>;
