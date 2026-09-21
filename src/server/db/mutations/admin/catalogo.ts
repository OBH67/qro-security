import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import type { CondicionProducto, ProductRow } from "@/types/database";

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

export interface DatosProducto {
  sku?: string; // solo al crear; nunca se cambia después
  name: string;
  description?: string | null;
  brandId?: string | null;
  groupId: string;
  subcategoryId: string;
  price: number;
  stock?: number;
  status?: "activo" | "agotado" | "descontinuado";
  condition: CondicionProducto;
  conditionDetail?: string | null;
}

export async function crearProductoAdmin(datos: DatosProducto): Promise<ProductRow> {
  const admin = crearClienteAdmin();
  if (!datos.sku) throw new Error("Falta el SKU.");
  const { data, error } = await admin.rpc("crear_producto", {
    p_sku: datos.sku,
    p_name: datos.name,
    p_price: datos.price,
    p_group_id: datos.groupId,
    p_subcategory_id: datos.subcategoryId,
    p_brand_id: datos.brandId ?? null,
    p_description: datos.description ?? null,
    p_stock: datos.stock ?? 0,
    p_status: datos.status ?? "activo",
    p_condition: datos.condition,
    p_condition_detail: datos.conditionDetail ?? null,
  });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ProductRow;
}

export async function actualizarProductoAdmin(productId: string, changedBy: string, datos: Partial<DatosProducto>): Promise<ProductRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("actualizar_producto", {
    p_product_id: productId,
    p_changed_by: changedBy,
    p_name: datos.name ?? null,
    p_description: datos.description ?? null,
    p_brand_id: datos.brandId ?? null,
    p_group_id: datos.groupId ?? null,
    p_subcategory_id: datos.subcategoryId ?? null,
    p_price: datos.price ?? null,
    p_stock: datos.stock ?? null,
    p_status: datos.status ?? null,
    p_condition: datos.condition ?? null,
    p_condition_detail: datos.conditionDetail ?? null,
  });
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ProductRow;
}

/** Edición rápida de precio (doble clic en la tabla, panel-admin-maqueta
 * líneas 538-545) — el mismo `actualizar_producto()`, solo con precio. */
export async function actualizarPrecioProductoAdmin(productId: string, changedBy: string, price: number): Promise<ProductRow> {
  return actualizarProductoAdmin(productId, changedBy, { price });
}
