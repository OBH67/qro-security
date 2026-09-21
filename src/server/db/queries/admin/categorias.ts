import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { GroupRow, SubcategoryRow } from "@/types/database";

export interface NodoSubcategoria extends SubcategoryRow {
  hijos: NodoSubcategoria[];
  conteoProductos: number;
}

export interface NodoGrupo extends GroupRow {
  subcategorias: NodoSubcategoria[];
  conteoProductos: number;
}

/** F3: árbol completo (D7, sin límite de profundidad) con el conteo de
 * productos activos por nodo — para decidir en la UI si se puede
 * eliminar sin llamar al servidor. Traído entero y armado en memoria (a
 * la escala real, ~6 grupos y ~54 subcategorías, es más simple y barato
 * que una CTE recursiva por request). */
export async function obtenerArbolCategoriasAdmin(): Promise<NodoGrupo[]> {
  const supabase = await crearClienteServidor();

  const [{ data: grupos, error: e1 }, { data: subs, error: e2 }, { data: productos, error: e3 }] = await Promise.all([
    supabase.from("groups").select("*").order("position"),
    supabase.from("subcategories").select("*").order("position"),
    supabase.from("products").select("group_id, subcategory_id").eq("status", "activo"),
  ]);
  if (e1) throw new Error(`No se pudieron cargar los grupos: ${e1.message}`);
  if (e2) throw new Error(`No se pudieron cargar las subcategorías: ${e2.message}`);
  if (e3) throw new Error(`No se pudieron contar los productos: ${e3.message}`);

  const conteoPorSub = new Map<string, number>();
  const conteoPorGrupo = new Map<string, number>();
  for (const p of productos ?? []) {
    conteoPorSub.set(p.subcategory_id, (conteoPorSub.get(p.subcategory_id) ?? 0) + 1);
    conteoPorGrupo.set(p.group_id, (conteoPorGrupo.get(p.group_id) ?? 0) + 1);
  }

  function construirHijos(groupId: string, parentId: string | null): NodoSubcategoria[] {
    return (subs ?? [])
      .filter((s) => s.group_id === groupId && s.parent_id === parentId)
      .map((s) => ({ ...s, hijos: construirHijos(groupId, s.id), conteoProductos: conteoPorSub.get(s.id) ?? 0 }));
  }

  return (grupos ?? []).map((g) => ({
    ...g,
    subcategorias: construirHijos(g.id, null),
    conteoProductos: conteoPorGrupo.get(g.id) ?? 0,
  }));
}
