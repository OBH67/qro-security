import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { despacharPendientes } from "@/server/notifications/despachador";
import type { OrderRow } from "@/types/database";

/** C5.3-C5.6 — todas llaman a una función SQL `service_role`-only (0008,
 * 0015) y despachan el correo encolado justo después, fuera de la
 * transacción (mismo criterio ya usado en `mutations/comprobantes.ts` y
 * `mutations/pedidos.ts` del lado del cliente: C3.2). */

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

export async function validarPago(params: { orderId: string; changedBy: string }): Promise<OrderRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("validar_pago", { p_order_id: params.orderId, p_changed_by: params.changedBy, p_source: "panel" });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as OrderRow;
}

export async function rechazarComprobante(params: { orderId: string; changedBy: string; motivo: string }): Promise<OrderRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("liberar_apartado", {
    p_order_id: params.orderId,
    p_target_status: "pendiente_pago",
    p_reason: params.motivo,
    p_changed_by: params.changedBy,
    p_source: "panel",
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as OrderRow;
}

/** RN-16 (definitiva): rechazar un pago de Stripe que Stripe YA cobró
 * nunca regresa el pedido a `pendiente_pago` como un comprobante rechazado
 * — el dinero ya salió de la cuenta del cliente y no hay reembolso a
 * tarjeta ni en efectivo. Se acredita como saldo a favor y el pedido se
 * cancela (diseño-pagos-stripe.md §6.2, modal "Rechazar y abonar $X").
 *
 * Reutiliza las DOS funciones SQL ya aprobadas (`aplicar_saldo`,
 * `liberar_apartado`) exactamente como ya hace `cancelarPedido()` más abajo
 * para el caso de saldo aplicado al cancelar — no se escribe SQL nuevo
 * para esto. El monto a acreditar se lee del propio pago (nunca del
 * cliente): el recibido por Stripe si ya se confirmó (§4.3, SPEI con
 * monto distinto), o el esperado si no hay ese dato — misma fuente de
 * verdad que ya usa `obtenerPagoStripeAdmin()`. Sirve para las tres
 * acciones de §6.2/§6.3 que "abonan y cancelan": rechazar un pago normal,
 * el pago parcial/de más de SPEI, y el pago llegado sin inventario. */
export async function rechazarPagoStripe(params: { orderId: string; changedBy: string; motivo: string }): Promise<OrderRow> {
  const admin = crearClienteAdmin();

  const { data: pedido, error: errorPedido } = await admin.from("orders").select("user_id, folio").eq("id", params.orderId).maybeSingle();
  if (errorPedido) throw new Error(traducirError(errorPedido.message));
  if (!pedido) throw new Error("El pedido no existe.");

  const { data: pago, error: errorPago } = await admin
    .from("payments")
    .select("amount_cents, amount_received_cents")
    .eq("order_id", params.orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (errorPago) throw new Error(traducirError(errorPago.message));

  const montoCentavos = pago?.amount_received_cents ?? pago?.amount_cents ?? 0;
  if (montoCentavos > 0) {
    const { error: errorSaldo } = await admin.rpc("aplicar_saldo", {
      p_user_id: pedido.user_id,
      p_amount: montoCentavos / 100,
      p_kind: "ajuste",
      p_description: `Saldo a favor por rechazo del pago con Stripe del pedido ${pedido.folio}`,
      p_order_id: params.orderId,
      p_created_by: params.changedBy,
    });
    if (errorSaldo) throw new Error(traducirError(errorSaldo.message));
  }

  const { data, error } = await admin.rpc("liberar_apartado", {
    p_order_id: params.orderId,
    p_target_status: "cancelado",
    p_reason: params.motivo,
    p_changed_by: params.changedBy,
    p_source: "panel",
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as OrderRow;
}

export async function cancelarPedido(params: { orderId: string; changedBy: string; motivo?: string }): Promise<OrderRow> {
  const admin = crearClienteAdmin();

  // D3.4: si el pedido tenía saldo aplicado, se devuelve íntegro al
  // cancelar — antes de liberar el apartado, para que la bitácora de
  // saldo quede en orden por si algo más falla.
  const { data: pedido, error: errorPedido } = await admin.from("orders").select("user_id, credit_applied, folio").eq("id", params.orderId).maybeSingle();
  if (errorPedido) throw new Error(traducirError(errorPedido.message));
  if (pedido && Number(pedido.credit_applied) > 0) {
    const { error: errorSaldo } = await admin.rpc("aplicar_saldo", {
      p_user_id: pedido.user_id,
      p_amount: Number(pedido.credit_applied),
      p_kind: "ajuste",
      p_description: `Devolución de saldo por cancelación del pedido ${pedido.folio}`,
      p_order_id: params.orderId,
      p_created_by: params.changedBy,
    });
    if (errorSaldo) throw new Error(traducirError(errorSaldo.message));
  }

  const { data, error } = await admin.rpc("liberar_apartado", {
    p_order_id: params.orderId,
    p_target_status: "cancelado",
    p_reason: params.motivo ?? null,
    p_changed_by: params.changedBy,
    p_source: "panel",
  });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as OrderRow;
}

export async function marcarEnviado(params: { orderId: string; changedBy: string; costoEnvio: number | null }): Promise<OrderRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("marcar_enviado", { p_order_id: params.orderId, p_shipping_cost: params.costoEnvio, p_changed_by: params.changedBy, p_source: "panel" });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as OrderRow;
}

export async function marcarEntregado(params: { orderId: string; changedBy: string }): Promise<OrderRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("marcar_entregado", { p_order_id: params.orderId, p_changed_by: params.changedBy, p_source: "panel" });
  if (error) throw new Error(traducirError(error.message));
  await despacharPendientes();
  return data as unknown as OrderRow;
}
