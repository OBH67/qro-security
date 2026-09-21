import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesionStaff } from "@/server/auth/roles";
import { obtenerSolicitudesAdmin } from "@/server/db/queries/admin/solicitudes";
import type { EstadoSolicitudServicio, TipoServicio } from "@/types/database";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

/** E2.4 "exportable a CSV" — mismo patrón que `/api/admin/pedidos/exportar`
 * (Route Handler porque el resultado es un archivo, no datos para
 * renderizar). Solo `admin` (H5.1). */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesionStaff();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const estado = request.nextUrl.searchParams.get("estado") as EstadoSolicitudServicio | null;
  const servicio = request.nextUrl.searchParams.get("servicio") as TipoServicio | null;
  const { solicitudes } = await obtenerSolicitudesAdmin({ estado: estado ?? undefined, servicio: servicio ?? undefined });

  const encabezado = ["Folio", "Fecha", "Nombre", "Tipo de cliente", "Servicio", "Teléfono", "Correo", "Estado", "Municipio", "Estado (entidad)"];
  const filas = solicitudes.map((s) => [
    s.folio,
    new Date(s.created_at).toISOString(),
    s.full_name,
    s.client_type,
    s.service_type,
    s.phone,
    s.email,
    s.status,
    s.municipality,
    s.state,
  ]);
  const csv = [encabezado, ...filas].map((fila) => fila.map(celdaCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="solicitudes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
