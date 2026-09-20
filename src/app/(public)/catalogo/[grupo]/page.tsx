import { notFound } from "next/navigation";
import Link from "next/link";
import {
  contarProductosPorSubcategoriaRaiz,
  obtenerDestacadosDeGrupo,
  obtenerGrupoPorSlug,
  obtenerImagenesPrincipales,
  obtenerSubcategoriasDeGrupo,
} from "@/server/db/queries/catalogo";
import { mapearTarjetaProducto } from "@/lib/producto";
import { Migas } from "@/components/molecules/Migas";
import { CuadriculaProductos } from "@/components/organisms/CuadriculaProductos";
import { Boton } from "@/components/atoms/Boton";
import { PRODUCTOS_DESTACADOS_GRUPO } from "@/lib/constantes";

export const dynamic = "force-dynamic";

/** index.html:517-581 — página de aterrizaje de un grupo: subcategorías +
 * destacados. Criterio A1.1: "al entrar a un grupo se listan sus
 * subcategorías confirmadas". */
export default async function PaginaGrupo({
  params,
}: {
  params: Promise<{ grupo: string }>;
}) {
  const { grupo: grupoSlug } = await params;
  const grupo = await obtenerGrupoPorSlug(grupoSlug);
  if (!grupo) notFound();

  const [subcategorias, conteos, destacadosCrudos] = await Promise.all([
    obtenerSubcategoriasDeGrupo(grupo.id),
    contarProductosPorSubcategoriaRaiz(grupo.id),
    obtenerDestacadosDeGrupo(grupo.id, PRODUCTOS_DESTACADOS_GRUPO),
  ]);

  const subcategoriasRaiz = subcategorias
    .filter((s) => s.parent_id === null)
    .sort((a, b) => a.position - b.position);

  const imagenes = await obtenerImagenesPrincipales(destacadosCrudos.map((p) => p.id));
  const destacados = destacadosCrudos.map((p) => mapearTarjetaProducto(p, { imagenUrl: imagenes.get(p.id) }));

  return (
    <>
      <section
        style={{
          borderBottom: "1px solid var(--border)",
          background: "linear-gradient(180deg, rgba(7,17,28,.7), rgba(7,17,28,.95))",
        }}
      >
        <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "28px 20px 44px" }}>
          <Migas items={[{ label: "Inicio", href: "/" }, { label: grupo.name }]} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>{grupo.code}</span>
          <h1 style={{ margin: "8px 0 0" }}>{grupo.name}</h1>
          {grupo.description && (
            <p style={{ margin: "14px 0 0", maxWidth: "62ch", fontSize: 17, lineHeight: 1.55, color: "var(--text-muted)" }}>
              {grupo.description}
            </p>
          )}
        </div>
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "48px 20px 0" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 26 }}>Subcategorías</h2>
        {subcategoriasRaiz.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Este grupo todavía no tiene subcategorías publicadas.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {subcategoriasRaiz.map((sub) => (
              <Link
                key={sub.id}
                href={`/catalogo/${grupo.slug}/${sub.slug}`}
                style={{ display: "flex", gap: 14, alignItems: "center", padding: 16, background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "left" }}
              >
                <span
                  className="clip-corner-sm"
                  style={{ width: 34, height: 34, flex: "0 0 auto", display: "grid", placeItems: "center", border: "1px solid var(--border)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} style={{ width: 17, height: 17 }}>
                    <rect x="4" y="4" width="16" height="16" />
                    <path d="M4 10h16M10 10v10" />
                  </svg>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 14.5, lineHeight: 1.35, color: "var(--text-primary)" }}>{sub.name}</span>
                  <span className="font-data" style={{ display: "block", marginTop: 3, fontSize: 11, color: "var(--text-muted)" }}>
                    {conteos.get(sub.id) ?? 0} productos
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "56px 20px 80px" }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 26 }}>Destacados de {grupo.name}</h2>
        <CuadriculaProductos
          productos={destacados}
          vacio={{ titulo: "Todavía no hay productos publicados en este grupo.", hrefAccion: "/", textoAccion: "Volver al inicio" }}
        />
        <div style={{ marginTop: 26 }}>
          <Boton href={`/catalogo/${grupo.slug}/todos`} variante="secundaria">
            Ver todos los productos de {grupo.name}
          </Boton>
        </div>
      </section>
    </>
  );
}
