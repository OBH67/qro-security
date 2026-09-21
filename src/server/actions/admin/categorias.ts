"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import { crearGrupoAdmin, crearSubcategoriaAdmin, actualizarCategoriaAdmin, eliminarSubcategoriaAdmin } from "@/server/db/mutations/admin/categorias";
import type { GroupRow, SubcategoryRow } from "@/types/database";

/** F3: `admin` e `inventario` (H5.1, Catálogo es su alcance). */
const ROLES_CATALOGO = ["admin", "inventario"] as const;

function revalidarCategorias() {
  revalidatePath("/admin/catalogo/categorias");
  revalidatePath("/admin/catalogo");
  revalidatePath("/admin/catalogo/nuevo");
}

export async function crearGrupoAction(name: string, code: string): Promise<ResultadoAction<GroupRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    if (!name.trim()) throw new Error("Escribe el nombre del grupo.");
    if (!code.trim()) throw new Error("Escribe un código para el grupo.");
    const grupo = await crearGrupoAdmin(name, code);
    revalidarCategorias();
    return grupo;
  });
}

export async function crearSubcategoriaAction(groupId: string, name: string, parentId: string | null): Promise<ResultadoAction<SubcategoryRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    if (!name.trim()) throw new Error("Escribe el nombre de la subcategoría.");
    const sub = await crearSubcategoriaAdmin(groupId, name, parentId);
    revalidarCategorias();
    return sub;
  });
}

export async function actualizarCategoriaAction(tipo: "grupo" | "subcategoria", id: string, datos: { name?: string; active?: boolean }): Promise<ResultadoAction<GroupRow | SubcategoryRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const resultado = await actualizarCategoriaAdmin(tipo, id, datos);
    revalidarCategorias();
    return resultado;
  });
}

export async function eliminarSubcategoriaAction(id: string): Promise<ResultadoAction<{ ok: true }>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    await eliminarSubcategoriaAdmin(id);
    revalidarCategorias();
    return { ok: true as const };
  });
}
