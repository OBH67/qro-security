import Link from "next/link";
import type { Metadata } from "next";
import { obtenerSolicitudesAdmin } from "@/server/db/queries/admin/solicitudes";
import { TablaSolicitudesAdmin } from "@/components/organisms/admin/TablaSolicitudesAdmin";
import type { EstadoSolicitudServicio, TipoServicio } from "@/types/database";

export const metadata: Metadata = { title: "Solicitudes de servicio — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

const ESTADOS: { valor: EstadoSolicitudServicio | "todas"; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "nueva", label: "Nueva" },
  { valor: "contactada", label: "En seguimiento" },
  { valor: "cerrada", label: "Cerrada" },
];

const SERVICIOS: { valor: TipoServicio | "todos"; label: string }[] = [
  { valor: "todos", label: "Servicio: Todos" },
  { valor: "monitoreo", label: "Monitoreo de alarmas 24/7" },
  { valor: "guardias", label: "Guardias de seguridad" },
  { valor: "financiamiento", label: "Financiamiento y créditos" },
];

function construirQuery(base: { estado?: string; servicio?: string; q?: string }): string {
  const params = new URLSearchParams();
  if (base.estado && base.estado !== "todas") params.set("estado", base.estado);
  if (base.servicio && base.servicio !== "todos") params.set("servicio", base.servicio);
  if (base.q) params.set("q", base.q);
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** panel-admin-maqueta.html:851-910 (`isSolicitudes`) — traducción
 * literal. E2: solo `admin` (H5.1, no es parte del alcance de
 * `inventario`). */
export default async function PaginaSolicitudesAdmin({ searchParams }: { searchParams: Promise<{ estado?: string; servicio?: string; q?: string }> }) {
  const sp = await searchParams;
  const estado = ESTADOS.find((e) => e.valor === sp.estado)?.valor as EstadoSolicitudServicio | "todas" | undefined;
  const servicio = SERVICIOS.find((s) => s.valor === sp.servicio)?.valor as TipoServicio | "todos" | undefined;
  const busqueda = sp.q ?? "";

  const { solicitudes, conteos } = await obtenerSolicitudesAdmin({
    estado: estado && estado !== "todas" ? estado : undefined,
    servicio: servicio && servicio !== "todos" ? servicio : undefined,
    busqueda,
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="title" style={{ fontSize: 28, margin: 0 }}>
          Solicitudes de servicio
        </h1>
        <a href={`/api/admin/solicitudes/exportar${construirQuery({ estado, servicio })}`} className="btn btn-fantasma cut cut-10">
          Exportar CSV
        </a>
      </div>

      <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {estado && <input type="hidden" name="estado" value={estado} />}
        <input className="campo" style={{ maxWidth: 260 }} name="q" defaultValue={busqueda} placeholder="🔍 Nombre, correo o teléfono" />
        <select className="campo" style={{ maxWidth: 220 }} name="servicio" defaultValue={servicio ?? "todos"}>
          {SERVICIOS.map((s) => (
            <option key={s.valor} value={s.valor}>
              {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-fantasma cut cut-10">
          Buscar
        </button>
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }} role="group" aria-label="Filtro por estado">
        {ESTADOS.map((e) => (
          <Link
            key={e.valor}
            href={`/admin/solicitudes${construirQuery({ estado: e.valor, servicio, q: busqueda })}`}
            className={`chip${(estado ?? "todas") === e.valor ? " activo" : ""}`}
          >
            {e.label} {conteos[e.valor === "todas" ? "todas" : e.valor]}
          </Link>
        ))}
      </div>

      <TablaSolicitudesAdmin solicitudes={solicitudes} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
        <span>Mostrando {solicitudes.length} de {conteos.todas}</span>
      </div>
    </div>
  );
}
