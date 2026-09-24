import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import { firmarLecturaPrivada } from "@/server/storage/firmar";
import type { EstadoDevolucion } from "@/types/database";

export interface FilaDevolucionAdmin {
  id: string;
  folio: string;
  fecha: string;
  cliente: string;
  pedidoFolio: string;
  producto: string;
  condicion: string;
  pctSugerido: number;
  monto: string;
  status: EstadoDevolucion;
}

export interface ConteosDevolucionesPorEstado {
  todas: number;
  solicitada: number;
  en_revision: number;
  aprobada: number;
  rechazada: number;
}

/** D2.1: bandeja con su estado. Una fila por devolución, mostrando el
 * primer producto (la maqueta trata la devolución como una unidad — casi
 * siempre un solo producto por solicitud en la práctica). */
export async function obtenerDevolucionesAdmin(filtros: { estado?: EstadoDevolucion }): Promise<{ devoluciones: FilaDevolucionAdmin[]; conteos: ConteosDevolucionesPorEstado }> {
  const supabase = await crearClienteServidor();

  let consulta = supabase.from("returns").select("id, folio, created_at, order_id, user_id, status, credit_amount").order("created_at", { ascending: false }).limit(200);
  if (filtros.estado) consulta = consulta.eq("status", filtros.estado);
  const { data: devoluciones, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar las devoluciones: ${error.message}`);

  const { data: todasParaConteo, error: errorConteo } = await supabase.from("returns").select("status");
  if (errorConteo) throw new Error(`No se pudieron contar las devoluciones: ${errorConteo.message}`);
  const conteos: ConteosDevolucionesPorEstado = { todas: todasParaConteo?.length ?? 0, solicitada: 0, en_revision: 0, aprobada: 0, rechazada: 0 };
  for (const r of todasParaConteo ?? []) conteos[r.status as keyof typeof conteos]++;

  if (!devoluciones || devoluciones.length === 0) return { devoluciones: [], conteos };

  const returnIds = devoluciones.map((d) => d.id);
  const orderIds = [...new Set(devoluciones.map((d) => d.order_id))];
  const userIds = [...new Set(devoluciones.map((d) => d.user_id))];

  const [{ data: items, error: e1 }, { data: pedidos, error: e2 }, { data: perfiles, error: e3 }] = await Promise.all([
    supabase.from("return_items").select("return_id, order_item_id, condition, percentage, percentage_suggested, credit_amount").in("return_id", returnIds),
    supabase.from("orders").select("id, folio").in("id", orderIds),
    supabase.from("profiles").select("id, first_name, last_name").in("id", userIds),
  ]);
  if (e1) throw new Error(`No se pudieron cargar las partidas: ${e1.message}`);
  if (e2) throw new Error(`No se pudieron cargar los pedidos: ${e2.message}`);
  if (e3) throw new Error(`No se pudieron cargar los clientes: ${e3.message}`);

  const orderItemIds = [...new Set((items ?? []).map((i) => i.order_item_id))];
  const { data: orderItems, error: e4 } = orderItemIds.length > 0 ? await supabase.from("order_items").select("id, name").in("id", orderItemIds) : { data: [], error: null };
  if (e4) throw new Error(`No se pudieron cargar los productos: ${e4.message}`);

  const nombrePorOrderItem = new Map((orderItems ?? []).map((oi) => [oi.id, oi.name]));
  const folioPorPedido = new Map((pedidos ?? []).map((p) => [p.id, p.folio]));
  const nombrePorPerfil = new Map((perfiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]));
  const listaItems = items ?? [];
  const primerItemPorReturn = new Map<string, (typeof listaItems)[number]>();
  for (const it of listaItems) if (!primerItemPorReturn.has(it.return_id)) primerItemPorReturn.set(it.return_id, it);

  return {
    devoluciones: devoluciones.map((d) => {
      const item = primerItemPorReturn.get(d.id);
      return {
        id: d.id,
        folio: d.folio,
        fecha: d.created_at,
        cliente: nombrePorPerfil.get(d.user_id) ?? "—",
        pedidoFolio: folioPorPedido.get(d.order_id) ?? "—",
        producto: item ? (nombrePorOrderItem.get(item.order_item_id) ?? "—") : "—",
        condicion: item?.condition ?? "—",
        pctSugerido: item ? Number(item.percentage_suggested) : 0,
        monto: d.credit_amount ?? (item?.credit_amount ?? "0"),
        status: d.status,
      };
    }),
    conteos,
  };
}

export interface DetalleDevolucionAdmin {
  id: string;
  folio: string;
  cliente: string;
  pedidoFolio: string;
  reason: string;
  status: EstadoDevolucion;
  saldoActualCliente: number;
  fotos: string[]; // URLs firmadas de lectura
  items: {
    id: string;
    producto: string;
    sku: string;
    qty: number;
    unitPrice: string;
    condition: string;
    percentage: string;
    percentageSuggested: string; // P9: sugerido por la condición, inmutable — base del prellenado y de la nota ámbar
    creditAmount: string;
  }[];
}

export async function obtenerDetalleDevolucionAdmin(returnId: string): Promise<DetalleDevolucionAdmin | null> {
  const supabase = await crearClienteServidor();

  const { data: devolucion, error } = await supabase.from("returns").select("*").eq("id", returnId).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la devolución: ${error.message}`);
  if (!devolucion) return null;

  const [{ data: items, error: e1 }, { data: pedido, error: e2 }, { data: perfil, error: e3 }, { data: fotos, error: e4 }, { data: movimientos, error: e5 }] = await Promise.all([
    supabase.from("return_items").select("*").eq("return_id", returnId),
    supabase.from("orders").select("folio").eq("id", devolucion.order_id).maybeSingle(),
    supabase.from("profiles").select("first_name, last_name").eq("id", devolucion.user_id).maybeSingle(),
    supabase.from("return_photos").select("url").eq("return_id", returnId),
    supabase.from("credit_movements").select("amount").eq("user_id", devolucion.user_id),
  ]);
  if (e1) throw new Error(`No se pudieron cargar las partidas: ${e1.message}`);
  if (e2) throw new Error(`No se pudo cargar el pedido: ${e2.message}`);
  if (e3) throw new Error(`No se pudo cargar el cliente: ${e3.message}`);
  if (e4) throw new Error(`No se pudieron cargar las fotos: ${e4.message}`);
  if (e5) throw new Error(`No se pudo cargar el saldo: ${e5.message}`);

  const orderItemIds = (items ?? []).map((it) => it.order_item_id);
  const { data: orderItems } = orderItemIds.length > 0 ? await supabase.from("order_items").select("id, name, sku, unit_price").in("id", orderItemIds) : { data: [] };
  const orderItemPorId = new Map((orderItems ?? []).map((oi) => [oi.id, oi]));

  const fotosFirmadas = await Promise.all((fotos ?? []).map((f) => firmarLecturaPrivada(f.url)));

  return {
    id: devolucion.id,
    folio: devolucion.folio,
    cliente: perfil ? `${perfil.first_name} ${perfil.last_name}`.trim() : "—",
    pedidoFolio: pedido?.folio ?? "—",
    reason: devolucion.reason,
    status: devolucion.status,
    saldoActualCliente: (movimientos ?? []).reduce((s, m) => s + Number(m.amount), 0),
    fotos: fotosFirmadas,
    items: (items ?? []).map((it) => ({
      id: it.id,
      producto: orderItemPorId.get(it.order_item_id)?.name ?? "—",
      sku: orderItemPorId.get(it.order_item_id)?.sku ?? "—",
      qty: it.qty,
      unitPrice: orderItemPorId.get(it.order_item_id)?.unit_price ?? "0",
      condition: it.condition,
      percentage: it.percentage,
      percentageSuggested: it.percentage_suggested,
      creditAmount: it.credit_amount,
    })),
  };
}
