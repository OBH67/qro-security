"use client";

import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Singleton del SDK de Stripe.js del navegador (arquitectura-pagos-stripe.md
 * §1): `loadStripe()` se llama UNA sola vez a nivel de módulo, nunca dentro
 * de un render — así no se vuelve a cargar el script de Stripe en cada
 * remount del checkout. Mismo patrón que `WidgetTurnstile.tsx` para la
 * llave pública (`NEXT_PUBLIC_...!`, ya validada en `.env.example` /
 * `server/config/env.ts`, aunque en este entorno todavía no tenga un valor
 * real de prueba).
 */
let promesaStripe: Promise<Stripe | null> | undefined;

export function obtenerStripePromise(): Promise<Stripe | null> {
  if (!promesaStripe) {
    promesaStripe = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return promesaStripe;
}
