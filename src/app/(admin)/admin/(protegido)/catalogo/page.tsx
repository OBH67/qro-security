import Link from "next/link";
import type { Metadata } from "next";
import { obtenerProductosAdmin, obtenerDatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import { TablaCatalogoAdmin } from "@/components/organisms/admin/TablaCatalogoAdmin";
import type { EstadoProducto } from "@/types/database";

export const metadata: Metadata = { title: "Catálogo — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

/** panel-admin-maqueta.html:510-558 (`isCatalogo`) — traducción literal. */
export default async function PaginaCatalogoAdmin({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; grupo?: string; estado?: string; condicion?: string }>;
}) {
  const sp = await searchParams;
  const estado = sp.estado as EstadoProducto | undefined;
  const condicion = sp.condicion as "nuevo" | "usado" | undefined;

  const [{ productos, total }, datosFormulario] = await Promise.all([
    obtenerProductosAdmin({ busqueda: sp.q, grupoId: sp.grupo, estado, condicion }),
    obtenerDatosFormularioProducto(),
  ]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <h1 className="title" style={{ fontSize: 28, margin: 0 }}>
          Catálogo
        </h1>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/admin/catalogo/categorias" className="btn btn-fantasma cut cut-10">
            Categorías
          </Link>
          <Link href="/admin/catalogo/importar" className="btn btn-fantasma cut cut-10">
            Importar CSV
          </Link>
          <Link href="/admin/catalogo/nuevo" className="btn btn-primario cut cut-10">
            Nuevo producto
          </Link>
        </div>
      </div>

      <form method="get" style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <input className="campo" style={{ maxWidth: 280 }} name="q" defaultValue={sp.q} placeholder="🔍 Nombre o SKU" />
        <select className="campo" style={{ maxWidth: 200 }} name="grupo" defaultValue={sp.grupo ?? ""}>
          <option value="">Grupo: Todos</option>
          {datosFormulario.grupos.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select className="campo" style={{ maxWidth: 160 }} name="estado" defaultValue={sp.estado ?? ""}>
          <option value="">Estado: Todos</option>
          <option value="activo">Activo</option>
          <option value="agotado">Agotado</option>
          <option value="descontinuado">Baja</option>
        </select>
        <select className="campo" style={{ maxWidth: 170 }} name="condicion" defaultValue={sp.condicion ?? ""}>
          <option value="">Condición: Todas</option>
          <option value="nuevo">Nuevo</option>
          <option value="usado">Usado</option>
        </select>
        <button type="submit" className="btn btn-fantasma cut cut-10">
          Filtrar
        </button>
      </form>

      <TablaCatalogoAdmin productos={productos} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
        <span>Mostrando {productos.length} de {total}</span>
      </div>
    </div>
  );
}
