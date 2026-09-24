import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { EstadoPedido, InstruccionesPago, MetodoPagoStripe, OrderItemRow, OrderRow, PaymentProofRow } from "@/types/database";

export interface PedidoConItems extends OrderRow {
  items: OrderItemRow[];
  comprobante: PaymentProofRow | null;
}

/** C4: lista de pedidos del cliente con sesión — folio, fecha, total y
 * estado actual (RLS ya filtra a "solo lo propio"). */
export async function obtenerPedidosDeCliente(
  userId: string,
  filtroEstado?: EstadoPedido,
): Promise<OrderRow[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (filtroEstado) consulta = consulta.eq("status", filtroEstado);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar tus pedidos: ${error.message}`);
  return data ?? [];
}

/** C4: detalle — productos, dirección, comprobante subido e historial. El
 * historial (`order_status_history`) no es legible por el cliente por RLS
 * (solo admin) — se deja fuera del detalle del cliente a propósito, ver
 * nota en `.devsquad/estado.md` de este incremento. */
export async function obtenerPedidoPorFolio(userId: string, folio: string): Promise<PedidoConItems | null> {
  const supabase = await crearClienteServidor();
  const { data: pedido, error } = await supabase
    .from("orders")
    .select("*")
    .eq("folio", folio)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar el pedido: ${error.message}`);
  if (!pedido) return null;

  const [{ data: items, error: errorItems }, { data: comprobantes, error: errorComprobantes }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", pedido.id),
    supabase
      .from("payment_proofs")
      .select("*")
      .eq("order_id", pedido.id)
      .order("uploaded_at", { ascending: false })
      .limit(1),
  ]);
  if (errorItems) throw new Error(`No se pudieron cargar los productos del pedido: ${errorItems.message}`);
  if (errorComprobantes) throw new Error(`No se pudo cargar el comprobante: ${errorComprobantes.message}`);

  return { ...pedido, items: items ?? [], comprobante: comprobantes?.[0] ?? null };
}

/** P3.2/P4.2: el voucher OXXO o la CLABE SPEI del intento más reciente de
 * este pedido, para mostrarlos en el detalle del pedido en Mis pedidos
 * (`FichaPagoOXXO`/`DatosPagoSPEI`, mismo componente que la pantalla
 * inmediata post-pago). A propósito usa `crearClienteServidor()` (RLS,
 * `payments_select_own`, 0028) en vez del cliente admin — es una lectura
 * del propio cliente, no una operación de servidor con privilegios. */
export async function obtenerPagoStripeDelPedido(
  orderId: string,
  method: MetodoPagoStripe,
): Promise<{ instructions: InstruccionesPago | null; expiresAt: string | null } | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("payments")
    .select("instructions, expires_at")
    .eq("order_id", orderId)
    .eq("method", method)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar tu ficha de pago: ${error.message}`);
  if (!data) return null;
  return { instructions: (data.instructions as InstruccionesPago | null) ?? null, expiresAt: data.expires_at };
}

/** Datos bancarios configurables por el admin (C1.3/C1.6, H4) — nunca
 * escritos en el código. Si el admin todavía no los ha llenado (H4 es de
 * otro incremento), regresa `null` en cada campo: la pantalla debe mostrar
 * un estado vacío explícito, no un dato inventado. */
export async function obtenerDatosBancarios(): Promise<{
  bankName: string | null;
  beneficiary: string | null;
  clabe: string | null;
  accountNumber: string | null;
}> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["bank_name", "beneficiary", "clabe", "account_number"]);
  if (error) throw new Error(`No se pudieron cargar los datos bancarios: ${error.message}`);

  const porLlave = new Map((data ?? []).map((s) => [s.key, s.value]));
  return {
    bankName: porLlave.get("bank_name") ?? null,
    beneficiary: porLlave.get("beneficiary") ?? null,
    clabe: porLlave.get("clabe") ?? null,
    accountNumber: porLlave.get("account_number") ?? null,
  };
}
