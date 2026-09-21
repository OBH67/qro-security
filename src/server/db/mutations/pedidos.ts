import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { despacharPendientes } from "@/server/notifications/despachador";
import type { DatosFiscalesCongelados, DireccionCongelada, OrderRow } from "@/types/database";

/**
 * Generar un pedido mueve inventario en su caso límite (saldo cubre el
 * 100%, D3.3) y siempre escribe la bitácora inmutable de estado —
 * arquitectura §6.1, caso 1 y 2: se llama con `service_role` por RPC a
 * `crear_pedido()` (§9.1, `0010_pedidos_carrito_b_c.sql`), nunca con el
 * cliente con sesión.
 */
export async function crearPedido(params: {
  userId: string;
  items: { productId: string; qty: number }[];
  shippingAddress: DireccionCongelada;
  billingData: DatosFiscalesCongelados | null;
  wantsInvoice: boolean;
  notes?: string | null;
  /** Llave de idempotencia (0011): un UUID por intento de checkout,
   * generado en el cliente al entrar a /pagar. Obligatoria desde esta
   * acción hacia el servidor — ver `esquemaGenerarPedido`. La función SQL
   * la regresa como el pedido ya creado si se repite la llamada, en vez de
   * duplicar el pedido. */
  idempotencyKey: string;
  /** D3: saldo que el cliente pidió aplicar — `crear_pedido()` lo acota al
   * subtotal y `aplicar_saldo()` valida que no exceda lo que el cliente
   * realmente tiene (RN-7), con su propio candado transaccional. */
  creditToApply: number;
}): Promise<OrderRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("crear_pedido", {
    p_user_id: params.userId,
    p_items: params.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_shipping_address: params.shippingAddress,
    p_billing_data: params.billingData,
    p_wants_invoice: params.wantsInvoice,
    p_credit_to_apply: params.creditToApply,
    p_notes: params.notes ?? null,
    p_idempotency_key: params.idempotencyKey,
  });

  if (error) throw new Error(traducirErrorPedido(error.message));

  // D3.3: si el saldo cubrió el 100%, crear_pedido() ya llamó a
  // apartar_pedido() internamente y encoló las mismas notificaciones que
  // C2 — mismo criterio que confirmarComprobante(): el envío ocurre
  // después del commit, nunca dentro de él (C3.2). Si no encoló nada
  // (pedido normal, pendiente de comprobante), esto no hace nada.
  await despacharPendientes();

  return data as unknown as OrderRow;
}

/** Traduce los mensajes de negocio que lanza `crear_pedido()` (ya en
 * español de negocio desde la función SQL) — se conservan tal cual salvo
 * el prefijo técnico que a veces antepone PostgREST. */
function traducirErrorPedido(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}
