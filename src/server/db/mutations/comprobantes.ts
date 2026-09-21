import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { crearClienteServidor } from "@/server/supabase/server";
import { env } from "@/server/config/env";
import { rutaComprobante } from "@/server/storage/rutas";
import { firmarSubidaPrivada } from "@/server/storage/firmar";
import { verificarObjetoSubido, leerPrimerosBytes } from "@/server/storage/r2";
import { validarComprobante, contentTypePermitido } from "@/server/domain/comprobantes";
import { despacharPendientes } from "@/server/notifications/despachador";
import type { DatosComprobante } from "@/lib/esquemas/checkout";
import type { OrderRow } from "@/types/database";

/** Paso 1-2 de arquitectura §7.1: el servidor genera la clave (el cliente
 * nunca elige la ruta) y firma un PUT de 5 minutos hacia el bucket
 * PRIVADO — el comprobante nunca es públicamente accesible (C2.6). */
export async function prepararSubidaComprobante(params: { folio: string; extension: string; contentType: string }) {
  const tipo = contentTypePermitido(params.contentType);
  if (!tipo) throw new Error("Solo se aceptan imágenes JPG, PNG, HEIC o PDF.");

  const key = rutaComprobante(params.folio, params.extension);
  const firma = await firmarSubidaPrivada({ key, tipo });
  return { key, ...firma };
}

/** Paso 5 de arquitectura §7.1: tras el PUT directo navegador→R2, el
 * servidor confirma tamaño y tipo REAL (magic bytes, C2.2) antes de dar el
 * archivo por bueno; luego inserta el comprobante y aparta las piezas en
 * una sola transacción vía `confirmar_comprobante()` (0010,
 * `service_role` — arquitectura §6.1 caso 1). */
export async function confirmarComprobante(params: {
  userId: string;
  orderId: string;
  key: string;
  datos: DatosComprobante;
}): Promise<OrderRow> {
  const { existe, tamanoBytes, tipoDeclarado } = await verificarObjetoSubido(env.R2_BUCKET_PRIVATE, params.key);
  if (!existe) throw new Error("No se encontró el archivo subido. Intenta de nuevo.");

  const primerosBytes = await leerPrimerosBytes(env.R2_BUCKET_PRIVATE, params.key);
  const validacion = validarComprobante({ tamanoBytes, contentTypeDeclarado: tipoDeclarado, primerosBytes });
  if (!validacion.ok) throw new Error(validacion.motivo);

  const admin = crearClienteAdmin();
  const { data, error } = await admin.rpc("confirmar_comprobante", {
    p_order_id: params.orderId,
    p_user_id: params.userId,
    p_file_url: params.key,
    p_transfer_date: params.datos.transferDate,
    p_amount: params.datos.amount,
    p_origin_bank: params.datos.originBank || null,
    p_spei_tracking_key: params.datos.speiTrackingKey || null,
  });

  if (error) throw new Error(error.message.replace(/^ERROR:\s*/i, "").trim());

  // arquitectura.md §7.3, paso 2: la transacción SQL ya encoló las filas
  // del outbox (dentro de apartar_pedido()) y ya hizo commit — el envío
  // real ocurre aquí, fuera de esa transacción, para que una falla de
  // Resend nunca pueda revertir un cambio de estado ya confirmado (C3.2).
  await despacharPendientes();

  return data as unknown as OrderRow;
}

/** Verifica, con el cliente CON SESIÓN (RLS `orders_select_own`), que el
 * pedido exista, sea del cliente y siga pendiente de comprobante — antes
 * de firmar una subida o de confirmar. Evita que alguien intente subir un
 * comprobante a un pedido ajeno o ya avanzado. */
export async function pedidoListoParaComprobante(userId: string, orderId: string): Promise<boolean> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orders")
    .select("id, status, payment_method")
    .eq("id", orderId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo verificar el pedido: ${error.message}`);
  return !!data && data.status === "pendiente_pago" && data.payment_method === "transferencia";
}
