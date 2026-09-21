import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import { firmarLecturaPrivada } from "@/server/storage/firmar";
import type { EstadoPedido, OrderItemRow, OrderRow, OrderStatusHistoryRow, PaymentProofRow, ProfileRow } from "@/types/database";

export interface FilaPedidoAdmin {
  id: string;
  folio: string;
  fecha: string;
  cliente: string;
  correo: string;
  prods: number;
  total: string;
  creditApplied: string;
  status: EstadoPedido;
}

/** C5.1: lista filtrable por estado y buscable por folio, cliente o
 * correo. Cliente CON SESIÓN — RLS (`orders_select_own_or_admin`) ya deja
 * pasar todo a `admin`/`inventario`... en realidad Pedidos no es parte
 * del alcance de `inventario` (H5), pero la propia RLS de `orders` no lo
 * sabe: el candado real de "quién ve esta pantalla" ya lo puso el layout
 * (`rutaPermitidaParaRol`), esta consulta es una capa más, no la única. */
export async function obtenerPedidosAdmin(filtros: { estado?: EstadoPedido; busqueda?: string }): Promise<FilaPedidoAdmin[]> {
  const supabase = await crearClienteServidor();

  let consulta = supabase.from("orders").select("id, folio, created_at, user_id, total, credit_applied, status").order("created_at", { ascending: false }).limit(200);
  if (filtros.estado) consulta = consulta.eq("status", filtros.estado);
  const { data: pedidos, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar los pedidos: ${error.message}`);
  if (!pedidos || pedidos.length === 0) return [];

  const userIds = [...new Set(pedidos.map((p) => p.user_id))];
  const { data: perfiles, error: errorPerfiles } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds);
  if (errorPerfiles) throw new Error(`No se pudieron cargar los clientes: ${errorPerfiles.message}`);
  const perfilPorId = new Map((perfiles ?? []).map((p) => [p.id, p]));

  const orderIds = pedidos.map((p) => p.id);
  const { data: items, error: errorItems } = await supabase.from("order_items").select("order_id").in("order_id", orderIds);
  if (errorItems) throw new Error(`No se pudieron cargar las partidas: ${errorItems.message}`);
  const prodsPorPedido = new Map<string, number>();
  for (const it of items ?? []) prodsPorPedido.set(it.order_id, (prodsPorPedido.get(it.order_id) ?? 0) + 1);

  let filas: FilaPedidoAdmin[] = pedidos.map((p) => {
    const perfil = perfilPorId.get(p.user_id);
    return {
      id: p.id,
      folio: p.folio,
      fecha: p.created_at,
      cliente: perfil ? `${perfil.first_name} ${perfil.last_name}`.trim() : "—",
      correo: perfil?.email ?? "—",
      prods: prodsPorPedido.get(p.id) ?? 0,
      total: p.total,
      creditApplied: p.credit_applied,
      status: p.status,
    };
  });

  if (filtros.busqueda) {
    const q = filtros.busqueda.trim().toLowerCase();
    filas = filas.filter((f) => f.folio.toLowerCase().includes(q) || f.cliente.toLowerCase().includes(q) || f.correo.toLowerCase().includes(q));
  }

  return filas;
}

export interface ConteosPorEstado {
  todos: number;
  pendiente_pago: number;
  comprobante_recibido: number;
  listo_envio: number;
  enviado: number;
  entregado: number;
  cancelado: number;
}

export async function obtenerConteosPedidosPorEstado(): Promise<ConteosPorEstado> {
  const supabase = await crearClienteServidor();
  const estados: EstadoPedido[] = ["pendiente_pago", "comprobante_recibido", "listo_envio", "enviado", "entregado", "cancelado"];
  const resultados = await Promise.all(estados.map((e) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", e)));
  const conteos = Object.fromEntries(estados.map((e, i) => [e, resultados[i].count ?? 0])) as Omit<ConteosPorEstado, "todos">;
  return { todos: Object.values(conteos).reduce((s, n) => s + n, 0), ...conteos };
}

export interface DetallePedidoAdmin {
  pedido: OrderRow;
  items: (OrderItemRow & { disponible: number })[];
  comprobante: (PaymentProofRow & { urlLectura: string }) | null;
  historial: OrderStatusHistoryRow[];
  cliente: ProfileRow | null;
  movimientosSaldo: { fecha: string; descripcion: string; monto: string }[];
  saldoDisponibleCliente: number;
}

/** C5.2: comprobante en grande junto al importe esperado, productos,
 * historial, cliente, envío, factura — todo lo que la maqueta muestra en
 * el detalle (tanto la variante normal como la RN-11, que es la misma
 * pantalla con datos distintos: sin comprobante, con movimientos de
 * saldo). */
export async function obtenerDetallePedidoAdmin(folio: string): Promise<DetallePedidoAdmin | null> {
  const supabase = await crearClienteServidor();

  const { data: pedido, error } = await supabase.from("orders").select("*").eq("folio", folio).maybeSingle();
  if (error) throw new Error(`No se pudo cargar el pedido: ${error.message}`);
  if (!pedido) return null;

  const [itemsRes, comprobanteRes, historialRes, clienteRes, movimientosRes] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", pedido.id),
    supabase.from("payment_proofs").select("*").eq("order_id", pedido.id).order("uploaded_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("order_status_history").select("*").eq("order_id", pedido.id).order("changed_at", { ascending: true }),
    supabase.from("profiles").select("*").eq("id", pedido.user_id).maybeSingle(),
    supabase.from("credit_movements").select("created_at, description, amount").eq("user_id", pedido.user_id).order("created_at", { ascending: false }),
  ]);

  if (itemsRes.error) throw new Error(`No se pudieron cargar las partidas: ${itemsRes.error.message}`);
  if (historialRes.error) throw new Error(`No se pudo cargar el historial: ${historialRes.error.message}`);

  const productIds = (itemsRes.data ?? []).map((it) => it.product_id);
  const { data: productos } = productIds.length > 0 ? await supabase.from("products").select("id, stock, reserved").in("id", productIds) : { data: [] as { id: string; stock: number; reserved: number }[] };
  const disponiblePorProducto = new Map((productos ?? []).map((p) => [p.id, Math.max(0, p.stock - p.reserved)]));

  let comprobante: DetallePedidoAdmin["comprobante"] = null;
  if (comprobanteRes.data) {
    const urlLectura = await firmarLecturaPrivada(comprobanteRes.data.file_url);
    comprobante = { ...comprobanteRes.data, urlLectura };
  }

  const movimientos = movimientosRes.data ?? [];
  const saldoDisponibleCliente = movimientos.reduce((s, m) => s + Number(m.amount), 0);

  return {
    pedido,
    items: (itemsRes.data ?? []).map((it) => ({ ...it, disponible: disponiblePorProducto.get(it.product_id) ?? 0 })),
    comprobante,
    historial: historialRes.data ?? [],
    cliente: clienteRes.data ?? null,
    movimientosSaldo: movimientos.map((m) => ({ fecha: m.created_at, descripcion: m.description, monto: m.amount })),
    saldoDisponibleCliente,
  };
}
