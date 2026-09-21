import { notFound } from "next/navigation";
import { obtenerGrupoPorSlug, obtenerSubcategoriasHijas } from "@/server/db/queries/catalogo";
import { ListadoCatalogo } from "@/app/(public)/catalogo/_compartido/ListadoCatalogo";
import type { SearchParamsCrudos } from "@/lib/filtros";

export const dynamic = "force-dynamic";

/** "Ver todos los productos de {grupo}" (index.html `goGroupList`): lista
 * sin acotar a una subcategoría, con filtros (A4). Mismo contenido que
 * `/catalogo/[grupo]` desde que esa página dejó de ser una pantalla
 * aparte sin filtros — esta ruta se conserva porque varios enlaces del
 * sitio ya apuntan aquí explícitamente. */
export default async function PaginaTodosDelGrupo({
  params,
  searchParams,
}: {
  params: Promise<{ grupo: string }>;
  searchParams: Promise<SearchParamsCrudos>;
}) {
  const { grupo: grupoSlug } = await params;
  const sp = await searchParams;
  const grupo = await obtenerGrupoPorSlug(grupoSlug);
  if (!grupo) notFound();

  const subcategoriasRaiz = await obtenerSubcategoriasHijas(grupo.id, null);

  return (
    <ListadoCatalogo
      grupo={grupo}
      migas={[{ label: "Inicio", href: "/" }, { label: grupo.name, href: `/catalogo/${grupo.slug}` }, { label: "Todos los productos" }]}
      titulo={`Todo en ${grupo.name}`}
      basePath={`/catalogo/${grupo.slug}/todos`}
      searchParams={sp}
      categorias={subcategoriasRaiz.map((s) => ({ slug: s.slug, name: s.name, conteo: s.conteo, href: `/catalogo/${grupo.slug}/${s.slug}` }))}
    />
  );
}
