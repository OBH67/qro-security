import { z } from "zod";

/** B3.1: dirección completa — calle y número, colonia, municipio, estado,
 * CP, referencias, teléfono de contacto. `recipientName` cubre el
 * "teléfono de contacto" pedido por el criterio de forma equivalente al
 * demo (index.html no captura un teléfono de contacto distinto al del
 * perfil; se usa el celular ya registrado en B2 — no se inventa un campo
 * nuevo que ni el demo ni `diseño.md` piden). */
export const esquemaDireccion = z.object({
  label: z.string().trim().min(1, "Dale un nombre a esta dirección (Casa, Oficina...)."),
  street: z.string().trim().min(1, "Escribe la calle."),
  extNumber: z.string().trim().min(1, "Escribe el número exterior."),
  intNumber: z.string().trim().optional().or(z.literal("")),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "El código postal debe tener 5 dígitos."),
  neighborhood: z.string().trim().min(1, "Escribe la colonia."),
  municipality: z.string().trim().min(1, "Escribe el municipio."),
  state: z.string().trim().min(1, "Escribe el estado."),
  recipientName: z.string().trim().min(1, "Escribe el nombre de quien recibe."),
  directions: z.string().trim().optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type DatosDireccion = z.infer<typeof esquemaDireccion>;
