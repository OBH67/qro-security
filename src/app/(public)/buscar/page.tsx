import { buscarProductos, obtenerImagenesPrincipales, obtenerMarcasActivas } from "@/server/db/queries/catalogo";
import { mapearTarjetaProducto } from "@/lib/producto";
import { CuadriculaProductos } from "@/components/organisms/CuadriculaProductos";
import { Paginacion } from "@/components/molecules/Paginacion";

export const dynamic = "force-dynamic";

/** index.html:1767-1796 — resultados de búsqueda (A2). Reutiliza la
 * cuadrícula de producto del listado; no tiene panel de filtros (el demo
 * tampoco lo muestra aquí — A4 aplica al listado por categoría, no a la
 * búsqueda libre). Criterio A2.4: si no hay resultados, se ofrece una
 * salida útil en vez de una pantalla vacía. */
export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; pagina?: string }>;
}) {
  const sp = await searchParams;
  const termino = (sp.q ?? "").trim();
  const pagina = sp.pagina ? Math.max(1, Number(sp.pagina) || 1) : 1;

  const [{ productos: filas, total, totalPaginas }, marcas] = termino
    ? await Promise.all([buscarProductos(termino, pagina), obtenerMarcasActivas()])
    : [{ productos: [], total: 0, totalPaginas: 1 }, []];

  const imagenes = await obtenerImagenesPrincipales(filas.map((f) => f.id));
  const productos = filas.map((f) =>
    mapearTarjetaProducto(f, {
      nombreMarca: f.brand_id ? marcas.find((m) => m.id === f.brand_id)?.name : null,
      imagenUrl: imagenes.get(f.id),
    }),
  );

  return (
    <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "40px 20px 90px" }}>
      <h1 style={{ margin: 0, fontSize: "clamp(24px,2.6vw,34px)" }}>Resultados para &ldquo;{termino}&rdquo;</h1>
      <p className="font-data" style={{ margin: "8px 0 26px", fontSize: 13, color: "var(--text-muted)" }}>
        {total} resultados
      </p>

      <CuadriculaProductos
        productos={productos}
        vacio={{
          titulo: termino
            ? `No encontramos "${termino}". Revisa la ortografía o busca por SKU.`
            : "Escribe un producto, marca o SKU para buscar.",
          hrefAccion: "/catalogo/videovigilancia",
          textoAccion: "Ver catálogo",
        }}
      />

      <Paginacion
        paginaActual={pagina}
        totalPaginas={totalPaginas}
        construirHref={(p) => `/buscar?q=${encodeURIComponent(termino)}&pagina=${p}`}
      />
    </section>
  );
}
