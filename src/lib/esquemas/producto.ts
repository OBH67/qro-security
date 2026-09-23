import { z } from "zod";

/** F1.1/F1.2 — pestaña "General" del editor de producto
 * (panel-admin-maqueta.html:577-694, única pestaña construida en esta
 * pasada — ver H1-bis.2/diseño.md §11.7 para las demás). */
export const esquemaProducto = z
  .object({
    sku: z.string().trim().regex(/^SGQ-[A-Z]{2}-\d{4}(-[A-Z0-9]+)?$/, 'El SKU debe seguir el formato SGQ-XX-0000.'),
    name: z.string().trim().min(1, "Escribe el nombre del producto."),
    description: z.string().trim().optional().or(z.literal("")),
    brandId: z.uuid().optional().or(z.literal("")),
    groupId: z.uuid("Elige un grupo."),
    subcategoryId: z.uuid("Elige una subcategoría."),
    price: z.coerce.number().positive("Escribe un precio válido."),
    status: z.enum(["activo", "agotado", "descontinuado"]),
    condition: z.enum(["nuevo", "caja_abierta", "usado"]),
    conditionDetail: z.string().trim().optional().or(z.literal("")),
    stock: z.coerce.number().int().min(0).optional(),
  })
  .refine((d) => d.condition === "nuevo" || d.conditionDetail, {
    message: "Escribe el motivo visible al cliente para esta condición.",
    path: ["conditionDetail"],
  })
  .refine((d) => d.condition !== "nuevo" || (d.stock !== undefined && d.stock !== null), {
    message: "Escribe el stock inicial.",
    path: ["stock"],
  });

export type DatosProductoForm = z.infer<typeof esquemaProducto>;
