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

export async function marcarEnviado(params: { orderId: string; changedBy: string; costoEnvio: number }): Promise<OrderRow> {
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
