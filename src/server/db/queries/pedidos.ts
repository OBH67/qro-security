import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { EstadoPedido, InstruccionesPago, MetodoPagoStripe, OrderItemRow, OrderRow, PaymentProofRow } from "@/types/database";

export interface PedidoConItems extends OrderRow {
  items: OrderItemRow[];
  comprobante: PaymentProofRow | null;
}

export interface PedidoDeLista extends OrderRow {
  /** diseño-pagos-stripe.md §5.2: la fecha límite del intento de pago en
   * curso, para la segunda línea de la tarjeta ("OXXO · paga antes del…").
   * Nulo salvo cuando el pedido está en `pago_en_proceso` con método
   * Stripe. */
  pagoExpiraEn: string | null;
}

/** C4: lista de pedidos del cliente con sesión — folio, fecha, total y
 * estado actual (RLS ya filtra a "solo lo propio"). §5.2: para los pedidos
 * en `pago_en_proceso` se agrega la fecha límite del intento de pago en
 * curso (una consulta extra acotada a esos pedidos, no N+1: un solo
 * `select ... in (...)`). */
export async function obtenerPedidosDeCliente(
  userId: string,
  filtroEstado?: EstadoPedido,
): Promise<PedidoDeLista[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (filtroEstado) consulta = consulta.eq("status", filtroEstado);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar tus pedidos: ${error.message}`);
  const pedidos = data ?? [];

  const idsEnProceso = pedidos.filter((p) => p.status === "pago_en_proceso").map((p) => p.id);
  const expiraPorPedido = new Map<string, string | null>();
  if (idsEnProceso.length > 0) {
    const { data: pagos, error: errorPagos } = await supabase
      .from("payments")
      .select("order_id, expires_at, created_at")
      .in("order_id", idsEnProceso)
      .order("created_at", { ascending: false });
    if (errorPagos) throw new Error(`No se pudieron cargar tus fechas límite de pago: ${errorPagos.message}`);
    for (const pago of pagos ?? []) {
      if (!expiraPorPedido.has(pago.order_id)) expiraPorPedido.set(pago.order_id, pago.expires_at);
    }
  }

  return pedidos.map((p) => ({ ...p, pagoExpiraEn: expiraPorPedido.get(p.id) ?? null }));
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

export interface PagoStripeDelPedido {
  instructions: InstruccionesPago | null;
  expiresAt: string | null;
  /** P4.4: para detectar "pago parcial o de más" (SPEI) en el cliente —
   * `amountReceivedCents` puede no coincidir con `amountCents` mientras
   * Stripe sigue en `revision` (needsReview). */
  amountCents: number;
  amountReceivedCents: number | null;
  needsReview: boolean;
  /** Arquitectura §4.1 "pagada tarde / ya liberada": el pago se confirmó
   * (`updatedAt`) después de que venció la ficha/CLABE/30 min
   * (`expiresAt`) — el mismo dato que ya guarda la fila, sin una bandera
   * nueva en base de datos: comparar las dos fechas ya alcanza. */
  updatedAt: string;
  status: string;
  /** Últimos 4 dígitos de la tarjeta — diseño §5.3 SÍ se los muestra al
   * propio dueño de la tarjeta ("tarjeta terminada en 4242"), es distinto
   * del detalle de pago del admin (§6.2, marca + últimos 4 + decline codes
   * completos), que no es parte de este incremento. No es un dato sensible
   * para su propio dueño (no es el PAN completo, no hay riesgo PCI). */
  cardLast4: string | null;
}

/** P3.2/P4.2/P4.4: el voucher OXXO o la CLABE SPEI del intento más reciente
 * de este pedido, para mostrarlos en el detalle del pedido en Mis pedidos
 * (`FichaPagoOXXO`/`DatosPagoSPEI`, mismo componente que la pantalla
 * inmediata post-pago), más lo necesario para detectar "pago parcial o de
 * más" y "pagada tarde" (arquitectura §4.1/§4.3). Nunca expone
 * `stripe_payment_intent_id` ni `idempotency_key` (sin uso para el cliente,
 * son identificadores internos de Stripe/idempotencia). A propósito usa
 * `crearClienteServidor()` (RLS, `payments_select_own`, 0028) en vez del
 * cliente admin — es una lectura del propio cliente, no una operación de
 * servidor con privilegios; la policy ya acota por fila a "pagos de
 * pedidos propios" (dueño u admin), así que minimizar columnas en el
 * `select` explícito (en vez de `select *`) es la capa adicional de
 * "columnas mínimas necesarias" que pedía el encargo. */
export async function obtenerPagoStripeDelPedido(
  orderId: string,
  method: MetodoPagoStripe,
): Promise<PagoStripeDelPedido | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("payments")
    .select("instructions, expires_at, amount_cents, amount_received_cents, needs_review, updated_at, status, card_last4")
    .eq("order_id", orderId)
    .eq("method", method)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo cargar tu ficha de pago: ${error.message}`);
  if (!data) return null;
  return {
    instructions: (data.instructions as InstruccionesPago | null) ?? null,
    expiresAt: data.expires_at,
    amountCents: data.amount_cents,
    amountReceivedCents: data.amount_received_cents,
    needsReview: data.needs_review,
    updatedAt: data.updated_at,
    status: data.status,
    cardLast4: data.card_last4,
  };
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
