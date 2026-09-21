import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { ReturnRow, ReturnItemRow, OrderItemRow } from "@/types/database";

const PLAZO_DEFECTO_DIAS = 30; // RN-6/PA-3, mismo valor de respaldo que usa `solicitar_devolucion()`.

/** D1.1: cuántos días de plazo hay para pedir una devolución — configurable
 * desde H4 (`settings.return_window_days`), no fijo en el código. */
export async function obtenerPlazoDevolucionDias(): Promise<number> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("settings").select("value").eq("key", "return_window_days").maybeSingle();
  if (error) throw new Error(`No se pudo cargar el plazo de devolución: ${error.message}`);
  const n = data?.value ? Number(data.value) : NaN;
  return Number.isFinite(n) && n > 0 ? n : PLAZO_DEFECTO_DIAS;
}

export interface PartidaElegibleDevolucion {
  orderItemId: string;
  sku: string;
  name: string;
  unitPrice: string;
  qtyComprada: number;
  qtyYaDevuelta: number;
  qtyDisponible: number;
}

export interface PedidoElegibleDevolucion {
  orderId: string;
  folio: string;
  deliveredAt: string;
  diasRestantes: number;
  items: PartidaElegibleDevolucion[];
}

/** D1.1: pedidos ya entregados, dentro del plazo, con al menos una partida
 * que todavía se pueda devolver (no se devolvió ya por completo). Cliente
 * con sesión — RLS ya filtra a "solo lo propio". Consultas separadas por
 * tabla (no joins anidados de PostgREST), mismo patrón que
 * `queries/pedidos.ts`. */
export async function obtenerPedidosElegiblesParaDevolucion(userId: string): Promise<PedidoElegibleDevolucion[]> {
  const supabase = await crearClienteServidor();
  const plazoDias = await obtenerPlazoDevolucionDias();
  const limite = new Date();
  limite.setDate(limite.getDate() - plazoDias);

  const { data: pedidos, error } = await supabase
    .from("orders")
    .select("id, folio, delivered_at")
    .eq("user_id", userId)
    .eq("status", "entregado")
    .gte("delivered_at", limite.toISOString())
    .order("delivered_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar tus pedidos: ${error.message}`);
  if (!pedidos || pedidos.length === 0) return [];

  const orderIds = pedidos.map((p) => p.id);
  const { data: items, error: errItems } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", orderIds);
  if (errItems) throw new Error(`No se pudieron cargar los productos de tus pedidos: ${errItems.message}`);

  const orderItemIds = (items ?? []).map((it) => it.id);
  const devueltoPorPartida = new Map<string, number>();
  if (orderItemIds.length > 0) {
    const { data: devueltas, error: errDev } = await supabase
      .from("return_items")
      .select("order_item_id, qty, return_id")
      .in("order_item_id", orderItemIds);
    if (errDev) throw new Error(`No se pudieron cargar tus devoluciones previas: ${errDev.message}`);

    const returnIds = [...new Set((devueltas ?? []).map((d) => d.return_id))];
    const rechazadas = new Set<string>();
    if (returnIds.length > 0) {
      const { data: returns, error: errReturns } = await supabase
        .from("returns")
        .select("id, status")
        .in("id", returnIds)
        .eq("status", "rechazada");
      if (errReturns) throw new Error(`No se pudieron cargar tus devoluciones previas: ${errReturns.message}`);
      for (const r of returns ?? []) rechazadas.add(r.id);
    }

    for (const d of devueltas ?? []) {
      if (rechazadas.has(d.return_id)) continue; // una devolución rechazada no consume la pieza
      devueltoPorPartida.set(d.order_item_id, (devueltoPorPartida.get(d.order_item_id) ?? 0) + d.qty);
    }
  }

  const itemsPorPedido = new Map<string, OrderItemRow[]>();
  for (const it of items ?? []) {
    const lista = itemsPorPedido.get(it.order_id) ?? [];
    lista.push(it);
    itemsPorPedido.set(it.order_id, lista);
  }

  return pedidos
    .map((p) => {
      const entregado = new Date(p.delivered_at!);
      const vence = new Date(entregado);
      vence.setDate(vence.getDate() + plazoDias);
      const diasRestantes = Math.max(0, Math.ceil((vence.getTime() - Date.now()) / 86_400_000));

      const partidas: PartidaElegibleDevolucion[] = (itemsPorPedido.get(p.id) ?? [])
        .map((it) => {
          const yaDevuelta = devueltoPorPartida.get(it.id) ?? 0;
          return {
            orderItemId: it.id,
            sku: it.sku,
            name: it.name,
            unitPrice: it.unit_price,
            qtyComprada: it.qty,
            qtyYaDevuelta: yaDevuelta,
            qtyDisponible: it.qty - yaDevuelta,
          };
        })
        .filter((it) => it.qtyDisponible > 0);

      return { orderId: p.id, folio: p.folio, deliveredAt: p.delivered_at!, diasRestantes, items: partidas };
    })
    .filter((p) => p.items.length > 0);
}

export interface DevolucionDeCliente extends ReturnRow {
  items: ReturnItemRow[];
}

/** D1/D2: historial de solicitudes de devolución del cliente, con sus
 * partidas — para mostrar en "Mi cuenta → Devoluciones". */
export async function obtenerDevolucionesDeCliente(userId: string): Promise<DevolucionDeCliente[]> {
  const supabase = await crearClienteServidor();
  const { data: devoluciones, error } = await supabase
    .from("returns")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron cargar tus devoluciones: ${error.message}`);
  if (!devoluciones || devoluciones.length === 0) return [];

  const { data: items, error: errItems } = await supabase
    .from("return_items")
    .select("*")
    .in(
      "return_id",
      devoluciones.map((d) => d.id),
    );
  if (errItems) throw new Error(`No se pudieron cargar los productos de tus devoluciones: ${errItems.message}`);

  const itemsPorDevolucion = new Map<string, ReturnItemRow[]>();
  for (const it of items ?? []) {
    const lista = itemsPorDevolucion.get(it.return_id) ?? [];
    lista.push(it);
    itemsPorDevolucion.set(it.return_id, lista);
  }

  return (devoluciones as ReturnRow[]).map((r) => ({ ...r, items: itemsPorDevolucion.get(r.id) ?? [] }));
}
