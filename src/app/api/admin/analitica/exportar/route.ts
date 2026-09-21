import { NextResponse, type NextRequest } from "next/server";
import { obtenerSesionStaff } from "@/server/auth/roles";
import { obtenerAnaliticaAdmin, type OrdenRanking } from "@/server/db/queries/admin/analitica";

function celdaCsv(valor: string): string {
  return `"${valor.replace(/"/g, '""')}"`;
}

/** G1: "Exportar CSV" — mismo patrón que `/api/admin/pedidos/exportar`.
 * Exporta los rankings completos (más y menos vendidos) del rango y
 * filtros vigentes. Solo `admin` (H5.1). */
export async function GET(request: NextRequest) {
  const sesion = await obtenerSesionStaff();
  if (!sesion) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (sesion.rol !== "admin") return NextResponse.json({ error: "Sin permiso" }, { status: 403 });

  const sp = request.nextUrl.searchParams;
  const desde = sp.get("desde");
  const hasta = sp.get("hasta");
  if (!desde || !hasta) return NextResponse.json({ error: "Faltan las fechas del periodo" }, { status: 400 });

  const orden = (sp.get("orden") as OrdenRanking | null) ?? "unidades";
  const { masVendidos, menosVendidos } = await obtenerAnaliticaAdmin(
    { desde, hasta, groupId: sp.get("grupo") ?? undefined, subcategoryId: sp.get("subcategoria") ?? undefined },
    orden,
  );

  const encabezado = ["Ranking", "Producto", "SKU", "Unidades", "Importe"];
  const filas = [
    ...masVendidos.map((p) => ["Más vendidos", p.nombre, p.sku, String(p.unidades), p.importe.toFixed(2)]),
    ...menosVendidos.map((p) => ["Menos vendidos", p.nombre, p.sku, String(p.unidades), p.importe.toFixed(2)]),
  ];
  const csv = [encabezado, ...filas].map((fila) => fila.map(celdaCsv).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="analitica-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
