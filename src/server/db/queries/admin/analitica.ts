import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";

/** G1.2: mismo criterio que el tablero — "pago validado" es todo pedido
 * en `listo_envio`, `enviado` o `entregado`. */
const ESTADOS_PAGO_VALIDADO = ["listo_envio", "enviado", "entregado"] as const;

export type OrdenRanking = "unidades" | "importe";

export interface FiltrosAnalitica {
  desde: string; // ISO
  hasta: string; // ISO, exclusivo
  groupId?: string;
  subcategoryId?: string;
}

export interface KpisAnalitica {
  piezas: number;
  importe: number;
  pedidos: number;
  ticketPromedio: number;
}

export interface ProductoRanking {
  nombre: string;
  sku: string;
  unidades: number;
  importe: number;
}

export interface GrupoFiltro {
  id: string;
  nombre: string;
}

export interface SubcategoriaFiltro {
  id: string;
  groupId: string;
  nombre: string;
}

/** G1: KPIs + rankings de más/menos vendidos para el rango y filtros
 * elegidos. Un solo recorrido de `order_items` para ambos, filtrado por
 * grupo/subcategoría cuando aplica (G1.3) — "menos vendidos" son
 * productos que sí vendieron al menos 1 pieza, nunca los que no vendieron
 * nada (diseño.md §11.12). */
export async function obtenerAnaliticaAdmin(filtros: FiltrosAnalitica, orden: OrdenRanking = "unidades"): Promise<{
  kpis: KpisAnalitica;
  masVendidos: ProductoRanking[];
  menosVendidos: ProductoRanking[];
  totalProductosConVenta: number;
}> {
  const supabase = await crearClienteServidor();

  const { data: pedidos, error: e1 } = await supabase
    .from("orders")
    .select("id")
    .in("status", ESTADOS_PAGO_VALIDADO)
    .gte("created_at", filtros.desde)
    .lt("created_at", filtros.hasta);
  if (e1) throw new Error(`No se pudieron cargar los pedidos: ${e1.message}`);

  const orderIds = (pedidos ?? []).map((o) => o.id);
  const vacio = { kpis: { piezas: 0, importe: 0, pedidos: 0, ticketPromedio: 0 }, masVendidos: [], menosVendidos: [], totalProductosConVenta: 0 };
  if (orderIds.length === 0) return vacio;

  const { data: items, error: e2 } = await supabase.from("order_items").select("order_id, product_id, name, sku, qty, subtotal").in("order_id", orderIds);
  if (e2) throw new Error(`No se pudieron cargar las partidas: ${e2.message}`);

  let itemsFiltrados = items ?? [];

  if (filtros.groupId || filtros.subcategoryId) {
    const productIds = [...new Set(itemsFiltrados.map((it) => it.product_id))];
    const { data: productos, error: e3 } = await supabase.from("products").select("id, group_id, subcategory_id").in("id", productIds);
    if (e3) throw new Error(`No se pudieron cargar los productos: ${e3.message}`);
    const productoPorId = new Map((productos ?? []).map((p) => [p.id, p]));
    itemsFiltrados = itemsFiltrados.filter((it) => {
      const p = productoPorId.get(it.product_id);
      if (!p) return false;
      if (filtros.subcategoryId) return p.subcategory_id === filtros.subcategoryId;
      if (filtros.groupId) return p.group_id === filtros.groupId;
      return true;
    });
  }

  if (itemsFiltrados.length === 0) return vacio;

  const porSku = new Map<string, ProductoRanking>();
  const ordenesConVenta = new Set<string>();
  let piezas = 0;
  let importe = 0;
  for (const it of itemsFiltrados) {
    const actual = porSku.get(it.sku) ?? { nombre: it.name, sku: it.sku, unidades: 0, importe: 0 };
    actual.unidades += it.qty;
    actual.importe += Number(it.subtotal);
    porSku.set(it.sku, actual);
    ordenesConVenta.add(it.order_id);
    piezas += it.qty;
    importe += Number(it.subtotal);
  }

  const productos = [...porSku.values()];
  const pedidosCount = ordenesConVenta.size;
  const campo = orden === "importe" ? "importe" : "unidades";

  return {
    kpis: { piezas, importe, pedidos: pedidosCount, ticketPromedio: pedidosCount > 0 ? importe / pedidosCount : 0 },
    masVendidos: [...productos].sort((a, b) => b[campo] - a[campo]).slice(0, 10),
    menosVendidos: [...productos].sort((a, b) => a[campo] - b[campo]).slice(0, 10),
    totalProductosConVenta: productos.length,
  };
}

/** Distingue "sin ventas en este periodo" de "sin ventas nunca"
 * (diseño.md §11.12, dos vacíos distintos). */
export async function huboAlgunaVentaValidada(): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { count, error } = await supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ESTADOS_PAGO_VALIDADO);
  if (error) throw new Error(`No se pudo verificar el historial de ventas: ${error.message}`);
  return (count ?? 0) > 0;
}

/** Grupos y subcategorías planos para los selects de filtro (`grupo`/
 * `subcategoría`) — a diferencia de `obtenerArbolCategoriasAdmin()`
 * (F3), aquí no hace falta el árbol ni el conteo de productos. */
export async function obtenerFiltrosCategoria(): Promise<{ grupos: GrupoFiltro[]; subcategorias: SubcategoriaFiltro[] }> {
  const supabase = await crearClienteServidor();
  const [{ data: grupos, error: e1 }, { data: subs, error: e2 }] = await Promise.all([
    supabase.from("groups").select("id, name").order("position"),
    supabase.from("subcategories").select("id, group_id, name").order("position"),
  ]);
  if (e1) throw new Error(`No se pudieron cargar los grupos: ${e1.message}`);
  if (e2) throw new Error(`No se pudieron cargar las subcategorías: ${e2.message}`);

  return {
    grupos: (grupos ?? []).map((g) => ({ id: g.id, nombre: g.name })),
    subcategorias: (subs ?? []).map((s) => ({ id: s.id, groupId: s.group_id, nombre: s.name })),
  };
}
