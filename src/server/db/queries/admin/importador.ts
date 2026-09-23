import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { CatalogoParaValidar } from "@/server/domain/validacionImportacion";

/** Catálogo actual, en la forma que necesita `validarFilaImportacion()`
 * (F2.2) — todos los SKUs existentes y el árbol de grupo/subcategoría por
 * nombre, para resolver lo que el CSV escribió en texto libre. */
export async function obtenerCatalogoParaValidarImportacion(): Promise<CatalogoParaValidar> {
  const supabase = await crearClienteServidor();

  const [{ data: productos, error: e1 }, { data: grupos, error: e2 }, { data: subs, error: e3 }] = await Promise.all([
    supabase.from("products").select("sku"),
    supabase.from("groups").select("id, name"),
    supabase.from("subcategories").select("id, group_id, name"),
  ]);
  if (e1) throw new Error(`No se pudo cargar el catálogo: ${e1.message}`);
  if (e2) throw new Error(`No se pudieron cargar los grupos: ${e2.message}`);
  if (e3) throw new Error(`No se pudieron cargar las subcategorías: ${e3.message}`);

  return {
    skusExistentes: new Set((productos ?? []).map((p) => p.sku)),
    gruposPorNombre: new Map((grupos ?? []).map((g) => [g.name.toLowerCase(), g.id])),
    subcategoriasPorNombre: new Map((subs ?? []).map((s) => [s.name.toLowerCase(), { id: s.id, groupId: s.group_id }])),
  };
}

export interface CatalogoParaAplicar extends CatalogoParaValidar {
  productoIdPorSku: Map<string, string>;
  marcasPorNombre: Map<string, string>; // nombre en minúsculas → id
}

/** Paso 3 ("Aplicar") — lo mismo que `obtenerCatalogoParaValidarImportacion`
 * más lo que hace falta para escribir de verdad: el id del producto
 * existente por SKU (para saber A CUÁL actualizar) y las marcas por
 * nombre (columna "marca" del CSV, opcional — sin match, el producto
 * queda sin marca en vez de fallar la fila entera). Se vuelve a consultar
 * en cada lote (no una sola vez al iniciar el trabajo) porque un lote
 * anterior del mismo trabajo pudo haber creado productos o el catálogo
 * pudo cambiar entre lotes. */
export async function obtenerCatalogoParaAplicarImportacion(): Promise<CatalogoParaAplicar> {
  const supabase = await crearClienteServidor();

  const [{ data: productos, error: e1 }, { data: grupos, error: e2 }, { data: subs, error: e3 }, { data: marcas, error: e4 }] = await Promise.all([
    supabase.from("products").select("id, sku"),
    supabase.from("groups").select("id, name"),
    supabase.from("subcategories").select("id, group_id, name"),
    supabase.from("brands").select("id, name"),
  ]);
  if (e1) throw new Error(`No se pudo cargar el catálogo: ${e1.message}`);
  if (e2) throw new Error(`No se pudieron cargar los grupos: ${e2.message}`);
  if (e3) throw new Error(`No se pudieron cargar las subcategorías: ${e3.message}`);
  if (e4) throw new Error(`No se pudieron cargar las marcas: ${e4.message}`);

  return {
    skusExistentes: new Set((productos ?? []).map((p) => p.sku)),
    productoIdPorSku: new Map((productos ?? []).map((p) => [p.sku, p.id])),
    gruposPorNombre: new Map((grupos ?? []).map((g) => [g.name.toLowerCase(), g.id])),
    subcategoriasPorNombre: new Map((subs ?? []).map((s) => [s.name.toLowerCase(), { id: s.id, groupId: s.group_id }])),
    marcasPorNombre: new Map((marcas ?? []).map((m) => [m.name.toLowerCase(), m.id])),
  };
}
