import Link from "next/link";
import type { Metadata } from "next";
import { obtenerArbolCategoriasAdmin } from "@/server/db/queries/admin/categorias";
import { ArbolCategorias } from "@/components/organisms/admin/ArbolCategorias";

export const metadata: Metadata = { title: "Categorías — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

/** panel-admin-maqueta.html:711-774 (`isCategorias`) — traducción literal. */
export default async function PaginaCategoriasAdmin() {
  const grupos = await obtenerArbolCategoriasAdmin();

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <Link href="/admin/catalogo" style={{ fontSize: 13 }}>
          ‹ Catálogo
        </Link>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          Categorías
        </h1>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
        Grupo → subcategoría → sub-subcategoría (D7). Sin límite de profundidad impuesto por el sistema.
      </div>
      <ArbolCategorias grupos={grupos} />
    </div>
  );
}
