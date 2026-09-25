import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { finalizarPagoTarjeta, PagoNoCompletadoError, PedidoNoRegistradoError } from "@/server/pagos/checkoutTarjeta";

export const metadata: Metadata = { title: "Confirmando tu pago — SG Querétaro" };
export const dynamic = "force-dynamic";

/** Regreso de Stripe cuando el banco pidió verificación (3D Secure) fuera
 * del sitio: `return_url` de `confirmPayment()` en CheckoutForm. Crea el
 * pedido con la misma función que el checkout y el webhook. */
export default async function PaginaConfirmacionPago({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; redirect_status?: string }>;
}) {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/ingresar?siguiente=/mi-cuenta/pedidos");

  const { payment_intent: paymentIntentId, redirect_status: estado } = await searchParams;

  let folio: string | null = null;
  let mensaje: string;
  if (!paymentIntentId?.startsWith("pi_")) {
    mensaje = "No encontramos el pago que intentabas confirmar.";
  } else if (estado === "failed") {
    mensaje = "Tu banco no autorizó el pago. No se hizo ningún cargo y no se creó ningún pedido.";
  } else {
    try {
      folio = (await finalizarPagoTarjeta(paymentIntentId, sesion.userId)).folio;
      mensaje = "";
    } catch (error) {
      console.error("[pagar/confirmacion]", paymentIntentId, error);
      mensaje =
        error instanceof PagoNoCompletadoError
          ? "Tu pago no se completó. No se hizo ningún cargo y no se creó ningún pedido."
          : error instanceof PedidoNoRegistradoError
            ? `Recibimos tu pago, pero no pudimos registrar tu pedido (${error.message}). Escríbenos con la referencia ${paymentIntentId} y lo resolvemos con saldo a favor.`
            : `No pudimos confirmar tu pago. Escríbenos con la referencia ${paymentIntentId}.`;
    }
  }

  if (folio) redirect(`/mi-cuenta/pedidos/${folio}`);

  return (
    <section style={{ maxWidth: 640, margin: "0 auto", padding: "60px 20px 90px" }}>
      <h1 style={{ margin: "0 0 18px", fontSize: "clamp(26px,3vw,36px)" }}>No se completó tu pago</h1>
      <p role="alert" style={{ margin: "0 0 26px", fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)" }}>
        {mensaje}
      </p>
      <Link href="/pagar" style={{ color: "var(--accent)" }}>
        Volver a intentar el pago
      </Link>
    </section>
  );
}
