import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { urlDashboardStripe } from "@/server/pagos/stripe/pasarela";
import type { DetallePagoRevision } from "@/server/pagos/tipos";
import type { InstruccionesPago, MetodoPagoStripe, PaymentRow } from "@/types/database";

/** El intento más reciente de este método para el pedido — un pedido
 * puede tener más de una fila de `payments` si el cliente reintentó con
 * una llave de idempotencia nueva (p. ej. tras dejar vencer un voucher). */
async function obtenerUltimoPago(orderId: string, method: MetodoPagoStripe): Promise<PaymentRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from("payments")
    .select("*")
    .eq("order_id", orderId)
    .eq("method", method)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el pago: ${error.message}`);
  return (data as PaymentRow | null) ?? null;
}

/** P6.1: lo que la bandeja de revisión del admin necesita mostrar (monto,
 * fecha, estado en Stripe, marca/últimos 4, enlace al Dashboard). */
export async function obtenerDetalleRevisionPago(orderId: string, method: MetodoPagoStripe): Promise<DetallePagoRevision | null> {
  const pago = await obtenerUltimoPago(orderId, method);
  if (!pago) return null;
  return {
    metodo: method,
    montoCents: pago.amount_cents,
    fecha: pago.created_at,
    estado: pago.status,
    cardBrand: pago.card_brand,
    cardLast4: pago.card_last4,
    urlStripeDashboard: pago.stripe_payment_intent_id ? urlDashboardStripe(pago.stripe_payment_intent_id) : null,
    paymentIntentId: pago.stripe_payment_intent_id,
  };
}

/** P3.2/P4.2: el voucher OXXO o la CLABE SPEI que el webhook guardó al
 * recibir `payment_intent.requires_action`. */
export async function obtenerInstruccionesPago(orderId: string, method: Extract<MetodoPagoStripe, "oxxo" | "spei">): Promise<InstruccionesPago | null> {
  const pago = await obtenerUltimoPago(orderId, method);
  return pago?.instructions ?? null;
}

/** Para `verificarEnProveedor()`: el id del PaymentIntent vigente, si hay
 * uno, para consultar su estado directo en Stripe (P6.2). */
export async function obtenerPaymentIntentIdVigente(orderId: string, method: MetodoPagoStripe): Promise<string | null> {
  const pago = await obtenerUltimoPago(orderId, method);
  return pago?.stripe_payment_intent_id ?? null;
}

const DIAS_VIGENCIA_DEFECTO = 2;

/** H4: plazo configurable (1-3 días, `settings.oxxo_expires_days` /
 * `spei_expires_days`, 0028) de vigencia del voucher/CLABE. Cualquier
 * valor fuera de ese rango (fila borrada, valor inválido capturado a
 * mano) cae al default de la dueña en vez de romper el checkout. */
export async function obtenerDiasVigenciaPago(clave: "oxxo_expires_days" | "spei_expires_days"): Promise<number> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.from("settings").select("value").eq("key", clave).maybeSingle();
  if (error) throw new Error(`No se pudo leer la configuración de pagos: ${error.message}`);

  const dias = Number(data?.value);
  if (!Number.isInteger(dias) || dias < 1 || dias > 3) return DIAS_VIGENCIA_DEFECTO;
  return dias;
}
