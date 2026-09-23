import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { env } from "@/server/config/env";
import { rutaFotoProducto, rutaDocumentoProducto } from "@/server/storage/rutas";
import { firmarSubidaPublica } from "@/server/storage/firmar";
import { verificarObjetoSubido, leerPrimerosBytes, borrarObjetoR2 } from "@/server/storage/r2";
import { contentTypeFotoPermitido, validarFotoProducto, validarDocumentoProducto } from "@/server/domain/archivosProducto";
import type { ProductImageRow, ProductDocumentRow } from "@/types/database";

/** F1.4 — pestaña "Fotos": mismo flujo de 2 pasos que comprobantes/
 * devoluciones (arquitectura §7.1), sobre el bucket público. */
export async function prepararSubidaFotoProducto(params: { sku: string; nombreArchivo: string; contentType: string }) {
  const tipo = contentTypeFotoPermitido(params.contentType);
  if (!tipo) throw new Error("Solo se aceptan fotos JPG, PNG o WebP.");

  const extension = params.nombreArchivo.includes(".") ? params.nombreArchivo.split(".").pop()! : tipo;
  const key = rutaFotoProducto(params.sku, extension);
  const firma = await firmarSubidaPublica({ key, contentType: params.contentType });
  return { key, ...firma };
}

/** Tras el PUT exitoso: confirma tamaño/tipo real y la agrega al final de
 * la galería (`position` = máxima existente + 1 → nunca desplaza la foto
 * principal actual, que es la de `position` más baja). */
export async function confirmarFotoProducto(params: { productId: string; key: string; alt: string }): Promise<ProductImageRow> {
  const { existe, tamanoBytes, tipoDeclarado } = await verificarObjetoSubido(env.R2_BUCKET_PUBLIC, params.key);
  if (!existe) throw new Error("No se encontró la foto subida. Intenta de nuevo.");

  const primerosBytes = await leerPrimerosBytes(env.R2_BUCKET_PUBLIC, params.key);
  const validacion = validarFotoProducto({ tamanoBytes, contentTypeDeclarado: tipoDeclarado, primerosBytes });
  if (!validacion.ok) throw new Error(validacion.motivo);

  const admin = crearClienteAdmin();
  const { data: existentes, error: errorPosicion } = await admin
    .from("product_images")
    .select("position")
    .eq("product_id", params.productId)
    .order("position", { ascending: false })
    .limit(1);
  if (errorPosicion) throw new Error(`No se pudo guardar la foto: ${errorPosicion.message}`);
  const siguientePosicion = (existentes?.[0]?.position ?? -1) + 1;

  const { data, error } = await admin
    .from("product_images")
    .insert({ product_id: params.productId, url: params.key, alt: params.alt, position: siguientePosicion })
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo guardar la foto: ${error.message}`);
  return data;
}

export async function eliminarFotoProducto(imageId: string): Promise<void> {
  const admin = crearClienteAdmin();
  const { data, error: errorLectura } = await admin.from("product_images").select("url").eq("id", imageId).maybeSingle();
  if (errorLectura) throw new Error(`No se pudo eliminar la foto: ${errorLectura.message}`);
  if (!data) return;

  const { error } = await admin.from("product_images").delete().eq("id", imageId);
  if (error) throw new Error(`No se pudo eliminar la foto: ${error.message}`);
  await borrarObjetoR2(env.R2_BUCKET_PUBLIC, data.url);
}

/** Reordena la galería completa según el arreglo de ids recibido (el
 * primero queda con `position = 0`, es decir la foto principal — F1.4). */
export async function reordenarFotosProducto(productId: string, ordenIds: string[]): Promise<void> {
  const admin = crearClienteAdmin();
  await Promise.all(
    ordenIds.map((id, indice) => admin.from("product_images").update({ position: indice }).eq("id", id).eq("product_id", productId)),
  );
}

/** F1.4 — pestaña "Documentos": mismo flujo, solo PDF. */
export async function prepararSubidaDocumentoProducto(params: { sku: string; nombreArchivo: string; contentType: string }) {
  if (params.contentType !== "application/pdf") throw new Error("Solo se aceptan documentos en PDF.");

  const key = rutaDocumentoProducto(params.sku, "pdf");
  const firma = await firmarSubidaPublica({ key, contentType: params.contentType });
  return { key, ...firma };
}

export async function confirmarDocumentoProducto(params: {
  productId: string;
  key: string;
  nombre: string;
  kind: "ficha_tecnica" | "manual" | "otro";
}): Promise<ProductDocumentRow> {
  const { existe, tamanoBytes, tipoDeclarado } = await verificarObjetoSubido(env.R2_BUCKET_PUBLIC, params.key);
  if (!existe) throw new Error("No se encontró el documento subido. Intenta de nuevo.");

  const primerosBytes = await leerPrimerosBytes(env.R2_BUCKET_PUBLIC, params.key);
  const validacion = validarDocumentoProducto({ tamanoBytes, contentTypeDeclarado: tipoDeclarado, primerosBytes });
  if (!validacion.ok) throw new Error(validacion.motivo);

  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from("product_documents")
    .insert({ product_id: params.productId, url: params.key, name: params.nombre, kind: params.kind, size_bytes: tamanoBytes })
    .select("*")
    .single();
  if (error) throw new Error(`No se pudo guardar el documento: ${error.message}`);
  return data;
}

export async function eliminarDocumentoProducto(documentId: string): Promise<void> {
  const admin = crearClienteAdmin();
  const { data, error: errorLectura } = await admin.from("product_documents").select("url").eq("id", documentId).maybeSingle();
  if (errorLectura) throw new Error(`No se pudo eliminar el documento: ${errorLectura.message}`);
  if (!data) return;

  const { error } = await admin.from("product_documents").delete().eq("id", documentId);
  if (error) throw new Error(`No se pudo eliminar el documento: ${error.message}`);
  await borrarObjetoR2(env.R2_BUCKET_PUBLIC, data.url);
}
