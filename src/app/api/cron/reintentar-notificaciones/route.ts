import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/server/config/env";
import { reintentarNotificacionesVencidas } from "@/server/notifications/despachador";

/**
 * arquitectura.md §7.3: cron que reintenta las notificaciones que el
 * despacho inmediato no logró enviar, con espera creciente, hasta 5
 * veces. Protegido con `CRON_SECRET` (arquitectura §12, "sin esto
 * cualquiera podría dispararlas") — Vercel Cron manda
 * `Authorization: Bearer $CRON_SECRET` cuando el cron se configura en
 * `vercel.json`.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const resultado = await reintentarNotificacionesVencidas();
  return NextResponse.json(resultado);
}
