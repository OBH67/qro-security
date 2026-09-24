import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { BrandRow, CondicionProducto, EstadoProducto, GroupRow, ProductRow, SubcategoryRow } from "@/types/database";

export interface FiltrosProductosAdmin {
  busqueda?: string;
  grupoId?: string;
  estado?: EstadoProducto;
  condicion?: CondicionProducto;
  /** Distinto de `estado: "agotado"` (ese es el status manual del
   * producto) — este filtra por `stock <= 0` sin importar el status,
   * que es lo que de verdad cuenta la tarjeta "Productos agotados" del
   * tablero (Inicio). Un producto puede quedarse sin stock sin que
   * nadie le haya cambiado el status a "Agotado" a mano. */
  sinStock?: boolean;
}

export interface FilaProductoAdmin {
  id: string;
  sku: string;
  name: string;
  marca: string | null;
  price: string;
  stock: number;
  status: EstadoProducto;
  condition: CondicionProducto;
  conditionDetail: string | null;
}

/** F1: lista del catálogo, filtrable — panel-admin-maqueta.html:510-558. */
export async function obtenerProductosAdmin(filtros: FiltrosProductosAdmin): Promise<{ productos: FilaProductoAdmin[]; total: number }> {
  const supabase = await crearClienteServidor();

  let consulta = supabase.from("products").select("id, sku, name, brand_id, price, stock, status, condition, condition_detail", { count: "exact" }).order("created_at", { ascending: false }).limit(200);
  if (filtros.grupoId) consulta = consulta.eq("group_id", filtros.grupoId);
  if (filtros.estado) consulta = consulta.eq("status", filtros.estado);
  if (filtros.condicion) consulta = consulta.eq("condition", filtros.condicion);
  if (filtros.sinStock) consulta = consulta.lte("stock", 0);
  if (filtros.busqueda) consulta = consulta.or(`name.ilike.%${filtros.busqueda}%,sku.ilike.%${filtros.busqueda}%`);

  const { data, error, count } = await consulta;
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);

  const brandIds = [...new Set((data ?? []).map((p) => p.brand_id).filter((id): id is string => !!id))];
  const { data: marcas } = brandIds.length > 0 ? await supabase.from("brands").select("id, name").in("id", brandIds) : { data: [] as { id: string; name: string }[] };
  const nombrePorMarca = new Map((marcas ?? []).map((m) => [m.id, m.name]));

  return {
    productos: (data ?? []).map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      marca: p.brand_id ? (nombrePorMarca.get(p.brand_id) ?? null) : null,
      price: p.price,
      stock: p.stock,
      status: p.status,
      condition: p.condition,
      conditionDetail: p.condition_detail,
    })),
    total: count ?? 0,
  };
}

export async function obtenerProductoAdminPorId(id: string): Promise<ProductRow | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`);
  return data;
}

export interface DatosFormularioProducto {
  grupos: GroupRow[];
  subcategoriasPorGrupo: Map<string, SubcategoryRow[]>;
  marcas: BrandRow[];
}

/** Datos para poblar los `<select>` del editor (F1.1/F1.2, D7). */
export async function obtenerDatosFormularioProducto(): Promise<DatosFormularioProducto> {
  const supabase = await crearClienteServidor();
  const [{ data: grupos, error: e1 }, { data: subs, error: e2 }, { data: marcas, error: e3 }] = await Promise.all([
    supabase.from("groups").select("*").eq("active", true).order("position"),
    supabase.from("subcategories").select("*").eq("active", true).order("position"),
    supabase.from("brands").select("*").eq("active", true).order("name"),
  ]);
  if (e1) throw new Error(`No se pudieron cargar los grupos: ${e1.message}`);
  if (e2) throw new Error(`No se pudieron cargar las subcategorías: ${e2.message}`);
  if (e3) throw new Error(`No se pudieron cargar las marcas: ${e3.message}`);

  const subcategoriasPorGrupo = new Map<string, SubcategoryRow[]>();
  for (const s of subs ?? []) {
    const lista = subcategoriasPorGrupo.get(s.group_id) ?? [];
    lista.push(s);
    subcategoriasPorGrupo.set(s.group_id, lista);
  }

  return { grupos: grupos ?? [], subcategoriasPorGrupo, marcas: marcas ?? [] };
}
