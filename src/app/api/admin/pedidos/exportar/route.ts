import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesionStaff } from "@/server/auth/roles";
import { obtenerPedidosAdmin } from "@/server/db/queries/admin/pedidos";
import { formatearPrecio } from "@/lib/formato";
import type { EstadoPedido } from "@/types/database";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

/** "Exportar CSV" de la bandeja de Pedidos (panel-admin-maqueta.html).
 * Route Handler, no Server Action, porque el resultado es un archivo para
 * descargar, no un dato para renderizar. Mismo candado que el resto del
 * panel (H2): sin sesión de `admin`, 401/403 — nunca un CSV filtrado por
 * accidente. */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesionStaff();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const estado = request.nextUrl.searchParams.get("estado") as EstadoPedido | null;
  const pedidos = await obtenerPedidosAdmin({ estado: estado ?? undefined });

  const encabezado = ["Folio", "Fecha", "Cliente", "Correo", "Productos", "Total", "Saldo aplicado", "Estado"];
  const filas = pedidos.map((p) => [p.folio, new Date(p.fecha).toISOString(), p.cliente, p.correo, String(p.prods), formatearPrecio(p.total), formatearPrecio(p.creditApplied), p.status]);
  const csv = [encabezado, ...filas].map((fila) => fila.map(celdaCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
