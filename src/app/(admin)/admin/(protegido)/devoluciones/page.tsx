import Link from "next/link";
import type { Metadata } from "next";
import { obtenerDevolucionesAdmin } from "@/server/db/queries/admin/devoluciones";
import { TablaDevolucionesAdmin } from "@/components/organisms/admin/TablaDevolucionesAdmin";
import type { EstadoDevolucion } from "@/types/database";

export const metadata: Metadata = { title: "Devoluciones — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

const ESTADOS: { valor: EstadoDevolucion | "todas"; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "solicitada", label: "Solicitada" },
  { valor: "en_revision", label: "En revisión" },
  { valor: "aprobada", label: "Aprobada" },
  { valor: "rechazada", label: "Rechazada" },
];

/** panel-admin-maqueta.html:776-849 (`isDevoluciones`) — traducción
 * literal: bandeja + cajón de resolución. D2: solo `admin` (H5.1, no es
 * parte del alcance de `inventario`). */
export default async function PaginaDevolucionesAdmin({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const sp = await searchParams;
  const estado = ESTADOS.find((e) => e.valor === sp.estado)?.valor as EstadoDevolucion | "todas" | undefined;

  const { devoluciones, conteos } = await obtenerDevolucionesAdmin({ estado: estado && estado !== "todas" ? estado : undefined });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="title" style={{ fontSize: 28, margin: 0 }}>
          Devoluciones
        </h1>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }} role="group" aria-label="Filtro por estado">
        {ESTADOS.map((e) => (
          <Link key={e.valor} href={`/admin/devoluciones${e.valor === "todas" ? "" : `?estado=${e.valor}`}`} className={`chip${(estado ?? "todas") === e.valor ? " activo" : ""}`}>
            {e.label} {conteos[e.valor === "todas" ? "todas" : e.valor]}
          </Link>
        ))}
      </div>

      <TablaDevolucionesAdmin devoluciones={devoluciones} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
        <span>Mostrando {devoluciones.length} de {conteos.todas}</span>
      </div>
    </div>
  );
}
