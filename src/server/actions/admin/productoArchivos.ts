"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import {
  prepararSubidaFotoProducto,
  confirmarFotoProducto,
  eliminarFotoProducto,
  reordenarFotosProducto,
  prepararSubidaDocumentoProducto,
  confirmarDocumentoProducto,
  eliminarDocumentoProducto,
} from "@/server/db/mutations/admin/productoArchivos";
import { obtenerAtributosDeCategoria } from "@/server/db/queries/catalogo";
import type { ProductImageRow, ProductDocumentRow, CategoryAttributeRow } from "@/types/database";

const ROLES_CATALOGO = ["admin", "inventario"] as const;

function revalidarProducto(productId: string) {
  revalidatePath(`/admin/catalogo/${productId}`);
}

// ── Fotos (F1.4) ────────────────────────────────────────────────────────

export async function iniciarSubidaFotoProductoAction(params: {
  sku: string;
  nombreArchivo: string;
  contentType: string;
}): Promise<ResultadoAction<{ key: string; url: string }>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => prepararSubidaFotoProducto(params));
}

export async function confirmarFotoProductoAction(params: {
  productId: string;
  key: string;
  alt: string;
}): Promise<ResultadoAction<ProductImageRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const imagen = await confirmarFotoProducto(params);
    revalidarProducto(params.productId);
    return imagen;
  });
}

export async function eliminarFotoProductoAction(productId: string, imageId: string): Promise<ResultadoAction<{ ok: true }>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    await eliminarFotoProducto(imageId);
    revalidarProducto(productId);
    return { ok: true as const };
  });
}

export async function reordenarFotosProductoAction(productId: string, ordenIds: string[]): Promise<ResultadoAction<{ ok: true }>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    await reordenarFotosProducto(productId, ordenIds);
    revalidarProducto(productId);
    return { ok: true as const };
  });
}

// ── Documentos (F1.4) ───────────────────────────────────────────────────

export async function iniciarSubidaDocumentoProductoAction(params: {
  sku: string;
  nombreArchivo: string;
  contentType: string;
}): Promise<ResultadoAction<{ key: string; url: string }>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => prepararSubidaDocumentoProducto(params));
}

export async function confirmarDocumentoProductoAction(params: {
  productId: string;
  key: string;
  nombre: string;
  kind: "ficha_tecnica" | "manual" | "otro";
}): Promise<ResultadoAction<ProductDocumentRow>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const documento = await confirmarDocumentoProducto(params);
    revalidarProducto(params.productId);
    return documento;
  });
}

export async function eliminarDocumentoProductoAction(productId: string, documentId: string): Promise<ResultadoAction<{ ok: true }>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    await eliminarDocumentoProducto(documentId);
    revalidarProducto(productId);
    return { ok: true as const };
  });
}

// ── Especificaciones (F1.4) ─────────────────────────────────────────────

/** Refresca los campos de la pestaña "Especificaciones" cuando se cambia
 * de grupo/subcategoría a media edición — los que llegaron por props
 * desde la página son los de la categoría ORIGINAL del producto. */
export async function obtenerAtributosDeCategoriaAction(groupId: string, subcategoryId: string): Promise<ResultadoAction<CategoryAttributeRow[]>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => obtenerAtributosDeCategoria({ groupId, subcategoryId }));
}
