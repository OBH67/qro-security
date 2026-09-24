"use server";

import { revalidatePath } from "next/cache";
import { esquemaProducto } from "@/lib/esquemas/producto";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import { crearProductoAdmin, actualizarProductoAdmin, actualizarPrecioProductoAdmin } from "@/server/db/mutations/admin/catalogo";
import type { ProductRow } from "@/types/database";

/** F1: `admin` e `inventario` (H5.1: Catálogo SÍ es parte de su alcance). */
const ROLES_CATALOGO = ["admin", "inventario"] as const;

function revalidarCatalogo(productId?: string) {
  revalidatePath("/admin/catalogo");
  if (productId) revalidatePath(`/admin/catalogo/${productId}`);
  // El catálogo público (`(public)/catalogo/**`) ya es `force-dynamic`
  // (siempre en vivo, sin caché que invalidar) — un alta/edición aquí se
  // ve de inmediato del lado del cliente sin nada más que hacer.
}

export async function crearProductoAction(datosCrudos: unknown): Promise<ResultadoAction<ProductRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const datos = esquemaProducto.parse(datosCrudos);
    const producto = await crearProductoAdmin({
      sku: datos.sku,
      name: datos.name,
      description: datos.description || null,
      brandId: datos.brandId || null,
      groupId: datos.groupId,
      subcategoryId: datos.subcategoryId,
      price: datos.price,
      status: datos.status,
      condition: datos.condition,
      conditionDetail: datos.condition !== "nuevo" ? datos.conditionDetail || null : null,
      // D6/diseño.md §11.7: una pieza usada o de caja abierta es única, su
      // existencia siempre es 1 — de solo lectura en la pantalla, forzado
      // aquí.
      stock: datos.condition !== "nuevo" ? 1 : datos.stock,
    });
    revalidarCatalogo(producto.id);
    return producto;
  });
}

export async function actualizarProductoAction(productId: string, datosCrudos: unknown): Promise<ResultadoAction<ProductRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async (sesion) => {
    const datos = esquemaProducto.omit({ sku: true }).parse(datosCrudos);
    const producto = await actualizarProductoAdmin(productId, sesion.userId, {
      name: datos.name,
      description: datos.description || null,
      brandId: datos.brandId || null,
      groupId: datos.groupId,
      subcategoryId: datos.subcategoryId,
      price: datos.price,
      status: datos.status,
      condition: datos.condition,
      conditionDetail: datos.condition !== "nuevo" ? datos.conditionDetail || null : null,
      stock: datos.condition !== "nuevo" ? 1 : datos.stock,
      attributes: datos.attributes,
    });
    revalidarCatalogo(productId);
    return producto;
  });
}

export async function actualizarPrecioAction(productId: string, price: number): Promise<ResultadoAction<ProductRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async (sesion) => {
    if (!Number.isFinite(price) || price <= 0) throw new Error("Escribe un precio válido.");
    const producto = await actualizarPrecioProductoAdmin(productId, sesion.userId, price);
    revalidarCatalogo(productId);
    return producto;
  });
}
