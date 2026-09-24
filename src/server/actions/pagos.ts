"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { conSesion, type ResultadoAction } from "@/server/actions/_guard";
import { crearClienteServidor } from "@/server/supabase/server";
import { obtenerEstrategia } from "@/server/pagos/registro";
import type { InicioPago, MetodoPago } from "@/server/pagos/tipos";

const esquemaIniciarPago = z.object({
  orderId: z.uuid(),
  metodo: z.enum(["tarjeta", "oxxo", "spei"]),
  idempotencyKey: z.uuid("Falta la llave de idempotencia del intento de pago."),
});

/**
 * P1-P4: el cliente ya eligió método en el selector del checkout; esta
 * acción arranca el intento (aparta inventario hacia `pago_en_proceso` +
 * crea el PaymentIntent) reutilizando la estrategia correspondiente
 * (P10). El comprobante NO pasa por aquí — su flujo (subir archivo) sigue
 * siendo `solicitarSubidaComprobanteAction`/`confirmarComprobanteAction`
 * (P1.2: "el comprobante conserva exactamente el flujo actual").
 */
export async function iniciarPagoStripeAction(datosCrudos: unknown): Promise<ResultadoAction<InicioPago>> {
  return conSesion(async (sesion) => {
    const datos = esquemaIniciarPago.parse(datosCrudos);

    const supabase = await crearClienteServidor();
    const { data: pedido, error } = await supabase
      .from("orders")
      .select("id, folio, user_id, total, status")
      .eq("id", datos.orderId)
      .eq("user_id", sesion.userId)
      .maybeSingle();
    if (error) throw new Error(`No se pudo cargar el pedido: ${error.message}`);
    if (!pedido) throw new Error("Pedido no encontrado.");
    if (pedido.status !== "pendiente_pago") {
      throw new Error("Este pedido ya no está pendiente de pago.");
    }

    const estrategia = obtenerEstrategia(datos.metodo as MetodoPago);
    const resultado = await estrategia.iniciar(
      {
        id: pedido.id,
        folio: pedido.folio,
        userId: pedido.user_id,
        userEmail: sesion.email,
        userNombre: `${sesion.perfil.first_name} ${sesion.perfil.last_name}`.trim(),
        totalCents: Math.round(Number(pedido.total) * 100),
      },
      { idempotencyKey: datos.idempotencyKey },
    );

    revalidatePath(`/mi-cuenta/pedidos/${pedido.folio}`);
    return resultado;
  });
}
