import "server-only";
import Stripe from "stripe";
import { env } from "@/server/config/env";

/**
 * Cliente Stripe del servidor (arquitectura-pagos-stripe.md §7). Nunca se
 * importa desde src/app/ ni src/components/ — toda la lógica de pagos pasa
 * por src/server/pagos/ (mismo candado de capas que server/supabase/admin.ts).
 *
 * Sin `apiVersion` explícita a propósito: el SDK instalado ya trae fijada
 * la versión con la que se probó (`stripe/apiVersion.js`) — fijar aquí un
 * string a mano arriesga desincronizarla de lo que el paquete realmente
 * entiende.
 */
export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);
