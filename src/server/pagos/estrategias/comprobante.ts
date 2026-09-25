import "server-only";
import type { EstrategiaPago, PedidoParaPago, CtxPago, InicioPago, DetallePagoRevision } from "../tipos";
import { pedidoListoParaComprobante, prepararSubidaComprobante } from "@/server/db/mutations/comprobantes";
import { crearClienteAdmin } from "@/server/supabase/admin";

/**
 * Envuelve el flujo de comprobante que ya existe (`db/mutations/
 * comprobantes.ts`, sin tocar su lógica de negocio) detrás de la misma
 * interfaz `EstrategiaPago` que tarjeta/oxxo/spei (P10, arquitectura §2).
 * `confirmar_comprobante()` (la subida en sí, paso 2) sigue viviendo en
 * `confirmarComprobanteAction` — la interfaz solo unifica "cómo arranca"
 * cada método, no cómo se completa (eso lo confirma el propio Payment
 * Element para Stripe, o un segundo POST del navegador para comprobante).
 */
export const estrategiaComprobante: EstrategiaPago = {
  metodo: "comprobante",

  async vigenciaApartado(): Promise<number | null> {
    // Sin vigencia propia por intento: el apartado de un comprobante vive
    // hasta el cron de 3 días (PA-7), no hasta un timeout de Stripe.
    return null;
  },

  async iniciar(pedido: PedidoParaPago, ctx: CtxPago): Promise<InicioPago> {
    if (!ctx.archivo) {
      throw new Error("Falta el archivo del comprobante.");
    }

    const listo = await pedidoListoParaComprobante(pedido.userId, pedido.id);
    if (!listo) throw new Error("Este pedido no está pendiente de comprobante.");

    const extension = ctx.archivo.nombreArchivo.includes(".") ? ctx.archivo.nombreArchivo.split(".").pop()! : "bin";
    const { key, url } = await prepararSubidaComprobante({
      folio: pedido.folio,
      extension,
      contentType: ctx.archivo.contentType,
    });

    return { tipo: "subir_archivo", urlFirmada: url, key };
  },

  async detalleRevision(pedidoId: string): Promise<DetallePagoRevision | null> {
    const admin = crearClienteAdmin();
    const { data, error } = await admin
      .from("payment_proofs")
      .select("amount, uploaded_at, status")
      .eq("order_id", pedidoId)
      .order("uploaded_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(`No se pudo leer el comprobante: ${error.message}`);
    if (!data) return null;

    return {
      metodo: "comprobante",
      montoCents: Math.round(Number(data.amount) * 100),
      fecha: data.uploaded_at,
      estado: data.status,
    };
  },
};
