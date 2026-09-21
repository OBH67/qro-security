import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import type { GroupRow, SubcategoryRow } from "@/types/database";

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

export async function crearGrupoAdmin(name: string, code: string): Promise<GroupRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("crear_grupo", { p_name: name, p_code: code });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as GroupRow;
}

export async function crearSubcategoriaAdmin(groupId: string, name: string, parentId: string | null): Promise<SubcategoryRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("crear_subcategoria", { p_group_id: groupId, p_name: name, p_parent_id: parentId });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as SubcategoryRow;
}

export async function actualizarCategoriaAdmin(tipo: "grupo" | "subcategoria", id: string, datos: { name?: string; active?: boolean }): Promise<GroupRow | SubcategoryRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("actualizar_categoria", { p_tipo: tipo, p_id: id, p_name: datos.name ?? null, p_active: datos.active ?? null });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as GroupRow | SubcategoryRow;
}

export async function eliminarSubcategoriaAdmin(id: string): Promise<void> {
  const admin = crearClienteAdmin();
  const { error } = await admin.rpc("eliminar_subcategoria", { p_id: id });
  if (error) throw new Error(traducirError(error.message));
}
