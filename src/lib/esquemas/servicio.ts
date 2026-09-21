import { z } from "zod";

/** E1.2: los campos que pide el demo (index.html:2474-2492, `srvFields`),
 * más el "honeypot" anti-spam (E1.4) — un campo invisible para personas
 * que los bots de formularios suelen rellenar solo. */
export const esquemaSolicitudServicio = z
  .object({
    serviceType: z.enum(["monitoreo", "guardias", "financiamiento"], { error: "Elige el servicio de tu interés." }),
    clientType: z.enum(["particular", "negocio", "empresa"]),
    fullName: z.string().trim().min(1, "Escribe tu nombre completo."),
    phone: z.string().trim().min(10, "Escribe un teléfono a 10 dígitos."),
    email: z.email("Escribe un correo válido."),
    state: z.string().trim().min(1, "Elige tu estado."),
    municipality: z.string().trim().min(1, "Escribe tu municipio o ciudad."),
    neighborhood: z.string().trim().optional().or(z.literal("")),
    addressReference: z.string().trim().optional().or(z.literal("")),
    propertyType: z.enum(["casa", "local", "oficina", "bodega", "industria", "otro"], { error: "Elige el tipo de inmueble." }),
    preferredTime: z.string().trim().optional().or(z.literal("")),
    amount: z.coerce.number().positive().optional(),
    termMonths: z.coerce.number().int().positive().optional(),
    message: z.string().trim().max(1000).optional().or(z.literal("")),
    /** Honeypot: un visitante real nunca lo llena porque el campo está
     * oculto con CSS, no con `type="hidden"` (los bots simples sí lo
     * respetan). Si llega con valor, se descarta en silencio (E1.4). */
    sitioWeb: z.string().optional().or(z.literal("")),
    /** Token de Cloudflare Turnstile (E1.4) — se verifica contra la API
     * real de Cloudflare en la Server Action, no aquí (esto solo valida
     * forma). */
    turnstileToken: z.string().min(1, "Confirma que no eres un robot."),
  })
  .refine((d) => d.serviceType !== "financiamiento" || d.amount !== undefined, {
    message: "Escribe el monto aproximado que necesitas financiar.",
    path: ["amount"],
  })
  .refine((d) => d.serviceType !== "financiamiento" || d.termMonths !== undefined, {
    message: "Elige el plazo deseado.",
    path: ["termMonths"],
  });

export type DatosSolicitudServicio = z.infer<typeof esquemaSolicitudServicio>;
