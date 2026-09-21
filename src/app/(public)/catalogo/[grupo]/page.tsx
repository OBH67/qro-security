import { notFound } from "next/navigation";
import { obtenerGrupoPorSlug, obtenerSubcategoriasHijas } from "@/server/db/queries/catalogo";
import { ListadoCatalogo } from "@/app/(public)/catalogo/_compartido/ListadoCatalogo";
import type { SearchParamsCrudos } from "@/lib/filtros";

export const dynamic = "force-dynamic";

/** Página de aterrizaje de un grupo (categoría) — ya no es una pantalla
 * aparte de tarjetas de subcategoría + destacados (index.html:517-581):
 * a pedido explícito de la dueña, entrar a una categoría debe tener el
 * mismo panel de filtros/banner/orden que entrar a una subcategoría, no
 * una pantalla distinta sin filtros. Las subcategorías raíz ahora viven
 * en la sección "Categorías" del panel (D7, primer nivel del árbol). */
export default async function PaginaGrupo({
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
      migas={[{ label: "Inicio", href: "/" }, { label: grupo.name }]}
      titulo={grupo.name}
      basePath={`/catalogo/${grupo.slug}`}
      searchParams={sp}
      categorias={subcategoriasRaiz.map((s) => ({ slug: s.slug, name: s.name, conteo: s.conteo, href: `/catalogo/${grupo.slug}/${s.slug}` }))}
    />
  );
}
