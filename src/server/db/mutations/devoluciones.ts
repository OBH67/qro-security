import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { crearClienteServidor } from "@/server/supabase/server";
import { env } from "@/server/config/env";
import { rutaFotoDevolucion } from "@/server/storage/rutas";
import { firmarSubidaPrivada } from "@/server/storage/firmar";
import { verificarObjetoSubido, leerPrimerosBytes } from "@/server/storage/r2";
import { validarComprobante, contentTypePermitido } from "@/server/domain/comprobantes";
import type { CondicionDevolucion, ReturnRow } from "@/types/database";

/** D1: crea la solicitud de devolución + sus partidas en una sola
 * transacción vía `solicitar_devolucion()` (0012, `service_role` — mismo
 * criterio que `crear_pedido()`: el folio y la validación de elegibilidad
 * son del servidor, nunca del cliente). */
export async function solicitarDevolucion(params: {
  userId: string;
  orderId: string;
  reason: string;
  items: { orderItemId: string; qty: number; condition: CondicionDevolucion }[];
}): Promise<ReturnRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("solicitar_devolucion", {
    p_user_id: params.userId,
    p_order_id: params.orderId,
    p_reason: params.reason,
    p_items: params.items.map((it) => ({ order_item_id: it.orderItemId, qty: it.qty, condition: it.condition })),
  });
  if (error) throw new Error(error.message.replace(/^ERROR:\s*/i, "").trim());
  return data as unknown as ReturnRow;
}

/** Verifica, con el cliente CON SESIÓN (RLS `returns_select_own`), que la
 * devolución exista y sea del cliente — antes de firmar una subida de foto
 * o de confirmarla. */
export async function devolucionListaParaFoto(userId: string, returnId: string): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("returns").select("id").eq("id", returnId).eq("user_id", userId).maybeSingle();
  if (error) throw new Error(`No se pudo verificar la devolución: ${error.message}`);
  return !!data;
}

/** D1.3: mismo patrón de subida de C2 (arquitectura §7.1) — clave generada
 * por el servidor, PUT directo navegador→R2 al bucket privado. */
export async function prepararSubidaFotoDevolucion(params: { folio: string; extension: string; contentType: string }) {
  const tipo = contentTypePermitido(params.contentType);
  if (!tipo) throw new Error("Solo se aceptan imágenes JPG, PNG o HEIC.");
  if (tipo === "pdf") throw new Error("Sube una foto (JPG, PNG o HEIC), no un PDF.");

  const key = rutaFotoDevolucion(params.folio, params.extension);
  const firma = await firmarSubidaPrivada({ key, tipo });
  return { key, ...firma };
}

/** Tras el PUT exitoso, confirma tamaño/tipo real (mismos magic bytes que
 * C2.2) e inserta la fila — con `service_role`, para no depender de la
 * política RLS pública de inserción directa del cliente. */
export async function confirmarFotoDevolucion(params: { returnId: string; key: string }): Promise<void> {
  const { existe, tamanoBytes, tipoDeclarado } = await verificarObjetoSubido(env.R2_BUCKET_PRIVATE, params.key);
  if (!existe) throw new Error("No se encontró la foto subida. Intenta de nuevo.");

  const primerosBytes = await leerPrimerosBytes(env.R2_BUCKET_PRIVATE, params.key);
  const validacion = validarComprobante({ tamanoBytes, contentTypeDeclarado: tipoDeclarado, primerosBytes });
  if (!validacion.ok) throw new Error(validacion.motivo);

  const admin = crearClienteAdmin();
  const { error } = await admin.from("return_photos").insert({ return_id: params.returnId, url: params.key });
  if (error) throw new Error(`No se pudo guardar la foto: ${error.message}`);
}
