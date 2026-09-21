import { z } from "zod";

/** B3.2/B3.3: datos fiscales opcionales, obligatorios y con RFC validado en
 * formato solo si el cliente marca "quiero factura". Formato de RFC
 * mexicano: persona física (13) o persona moral (12) — SAT. */
const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

export const esquemaDatosFiscales = z.object({
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(RFC_REGEX, "El RFC debe tener 12 o 13 caracteres en formato válido."),
  legalName: z.string().trim().min(1, "Escribe el nombre o razón social."),
  taxRegime: z.string().trim().min(1, "Elige el régimen fiscal."),
  cfdiUse: z.string().trim().min(1, "Elige el uso de CFDI."),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "El código postal fiscal debe tener 5 dígitos."),
  isDefault: z.boolean().optional(),
});

export type DatosFiscales = z.infer<typeof esquemaDatosFiscales>;

/** Catálogo corto de regímenes y usos de CFDI — el mismo que `index.html`
 * usa como opciones de relleno (index.html:2601-2602); es la única lista
 * disponible hasta que exista una fuente oficial (no se inventa el
 * catálogo completo del SAT, fuera de alcance de esta v1). */
export const REGIMENES_FISCALES = [
  "601 General de Ley Personas Morales",
  "605 Sueldos y Salarios",
  "612 Actividades Empresariales",
  "626 RESICO",
] as const;

export const USOS_CFDI = [
  "G01 Adquisición de mercancías",
  "G03 Gastos en general",
  "I08 Otra maquinaria y equipo",
] as const;
