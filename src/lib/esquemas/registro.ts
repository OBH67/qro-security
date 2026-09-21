import { z } from "zod";

/** B2.1: nombre completo, correo, teléfono celular y contraseña. Mismo
 * esquema para el formulario (retroalimentación inmediata) y la Server
 * Action (verdad autoritativa) — arquitectura.md §9.7. */
export const esquemaRegistro = z
  .object({
    firstName: z.string().trim().min(1, "Escribe tu nombre."),
    lastName: z.string().trim().min(1, "Escribe tus apellidos."),
    email: z.email("Escribe un correo válido."),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/\D/g, ""))
      .refine((v) => v.length === 10, "El teléfono debe tener 10 dígitos."),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export type DatosRegistro = z.infer<typeof esquemaRegistro>;

export const esquemaLogin = z.object({
  email: z.email("Escribe un correo válido."),
  password: z.string().min(1, "Escribe tu contraseña."),
});

export type DatosLogin = z.infer<typeof esquemaLogin>;

export const esquemaRecuperar = z.object({
  email: z.email("Escribe un correo válido."),
});

export type DatosRecuperar = z.infer<typeof esquemaRecuperar>;
