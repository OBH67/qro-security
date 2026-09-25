import { NextResponse, type NextRequest } from "next/server";
import { procesarWebhookStripe, FirmaWebhookInvalidaError } from "@/server/pagos/stripe/webhook";

/**
 * arquitectura-pagos-stripe.md §5: runtime Node (nunca Edge — el SDK de
 * Stripe necesita el `crypto` de Node para verificar la firma) y cuerpo
 * CRUDO (`request.text()`, nunca `request.json()`). Excluido de
 * `src/proxy.ts` (no necesita el refresco de cookies de sesión de
 * Supabase — Stripe nunca manda cookies).
 *
 * Toda la lógica de negocio (verificación de firma, idempotencia contra
 * `stripe_webhook_events`, RN-11) vive en
 * `src/server/pagos/stripe/webhook.ts`; este archivo solo traduce el
 * resultado a una respuesta HTTP.
 */
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const firma = request.headers.get("stripe-signature");
  if (!firma) {
    return NextResponse.json({ error: "Falta la firma del webhook." }, { status: 400 });
  }

  const cuerpoCrudo = await request.text();

  try {
    await procesarWebhookStripe(cuerpoCrudo, firma);
    return NextResponse.json({ recibido: true });
  } catch (error) {
    if (error instanceof FirmaWebhookInvalidaError) {
      // P5.1: firma inválida → 400 y no se toca nada.
      return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
    }

    // Error real de nuestro lado (BD caída, etc.) → 500, para que Stripe
    // reintente — nunca se pierde el evento en silencio.
    const mensaje = error instanceof Error ? error.message : "Error desconocido";
    console.error("[webhook stripe]", mensaje);
    return NextResponse.json({ error: "No se pudo procesar el evento." }, { status: 500 });
  }
}
