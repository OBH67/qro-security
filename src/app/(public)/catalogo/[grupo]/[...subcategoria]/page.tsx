import { notFound } from "next/navigation";
import { resolverRutaCatalogo } from "@/server/db/queries/catalogo";
import { ListadoCatalogo } from "@/app/(public)/catalogo/_compartido/ListadoCatalogo";
import type { SearchParamsCrudos } from "@/lib/filtros";
import type { MigaItem } from "@/components/molecules/Migas";

export const dynamic = "force-dynamic";

/** Listado acotado a una subcategoría (1, 2 o 3 niveles — D7,
 * `modelo-datos.md` §3). Incluye los productos de todos sus descendientes,
 * porque un producto siempre cuelga de la hoja más específica. */
export default async function PaginaSubcategoria({
  params,
  searchParams,
}: {
  params: Promise<{ grupo: string; subcategoria: string[] }>;
  searchParams: Promise<SearchParamsCrudos>;
}) {
  const { grupo: grupoSlug, subcategoria } = await params;
  const sp = await searchParams;

  const ruta = await resolverRutaCatalogo(grupoSlug, subcategoria);
  if (!ruta) notFound();

  const migas: MigaItem[] = [
    { label: "Inicio", href: "/" },
    { label: ruta.grupo.name, href: `/catalogo/${ruta.grupo.slug}` },
    ...ruta.cadena.slice(0, -1).map((s, i) => ({
      label: s.name,
      href: `/catalogo/${ruta.grupo.slug}/${ruta.cadena.slice(0, i + 1).map((c) => c.slug).join("/")}`,
    })),
    { label: ruta.hoja.name },
  ];

  return (
    <ListadoCatalogo
      grupo={ruta.grupo}
      subcategoryIds={ruta.idsAlcance}
      migas={migas}
      titulo={ruta.hoja.name}
      basePath={`/catalogo/${ruta.grupo.slug}/${subcategoria.join("/")}`}
      searchParams={sp}
    />
  );
}
