import type { GroupRow } from "@/types/database";
import {
  listarProductos,
  obtenerAtributosFiltrables,
  obtenerBannerDeGrupo,
  obtenerImagenesPrincipales,
  obtenerMarcasActivas,
  obtenerOpcionesMarca,
} from "@/server/db/queries/catalogo";
import { leerFiltros, type SearchParamsCrudos } from "@/lib/filtros";
import { mapearTarjetaProducto } from "@/lib/producto";
import { Migas, type MigaItem } from "@/components/molecules/Migas";
import { PanelFiltros, ChipsFiltrosActivos } from "@/components/organisms/PanelFiltros";
import { BarraFiltrosMovil } from "@/components/organisms/BarraFiltrosMovil";
import { BannerCatalogo } from "@/components/organisms/BannerCatalogo";
import { CuadriculaProductos } from "@/components/organisms/CuadriculaProductos";
import { Paginacion } from "@/components/molecules/Paginacion";
import { SelectOrden } from "@/components/molecules/SelectOrden";
import { serializarFiltros } from "@/lib/filtros";

/**
 * Página de listado con filtros (A1.2, A4) — compartida por
 * `/catalogo/[grupo]/todos` (todo el grupo) y
 * `/catalogo/[grupo]/[...subcategoria]` (una subcategoría y sus
 * descendientes). Es la traducción de index.html:583-700.
 */
export async function ListadoCatalogo({
  grupo,
  subcategoryIds,
  migas,
  titulo,
  basePath,
  searchParams,
}: {
  grupo: GroupRow;
  subcategoryIds?: string[];
  migas: MigaItem[];
  titulo: string;
  basePath: string;
  searchParams: SearchParamsCrudos;
}) {
  const filtros = leerFiltros(searchParams);
  const marcas = await obtenerMarcasActivas();
  const idsMarcaSeleccionada = marcas.filter((m) => filtros.marca.includes(m.slug)).map((m) => m.id);
  const nombresMarcaPorSlug = new Map(marcas.map((m) => [m.slug, m.name]));

  const [{ productos: filas, total, totalPaginas, pagina }, opcionesMarca, facetasAtributo, banner] = await Promise.all([
    listarProductos({
      groupId: grupo.id,
      subcategoryIds,
      marcaIds: idsMarcaSeleccionada.length > 0 ? idsMarcaSeleccionada : undefined,
      precioMin: filtros.precioMin,
      precioMax: filtros.precioMax,
      soloDisponibles: filtros.disponible,
      condiciones: filtros.condicion,
      atributos: filtros.atributos,
      orden: filtros.orden,
      pagina: filtros.pagina,
    }),
    obtenerOpcionesMarca({ groupId: grupo.id, subcategoryIds }),
    obtenerAtributosFiltrables({ groupId: grupo.id, subcategoryIds }),
    obtenerBannerDeGrupo(grupo.id),
  ]);
  const etiquetasAtributoPorClave = new Map(facetasAtributo.map((f) => [f.key, f.label]));

  const imagenes = await obtenerImagenesPrincipales(filas.map((f) => f.id));
  const productos = filas.map((f) =>
    mapearTarjetaProducto(f, {
      nombreMarca: f.brand_id ? marcas.find((m) => m.id === f.brand_id)?.name : null,
      imagenUrl: imagenes.get(f.id),
    }),
  );

  return (
    <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "28px 20px 80px" }}>
      <Migas items={migas} />
      <h1 style={{ margin: 0 }}>{titulo}</h1>
      <p className="font-data" style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
        {total} {total === 1 ? "resultado" : "resultados"}
      </p>

      <div style={{ marginTop: 20 }}>
        <BannerCatalogo banner={banner} />
      </div>

      {/* Móvil: disparador pegajoso ("Filtros y orden") que abre un cajón
          desde abajo (index.html:596/600) — oculto en escritorio.
          `position:sticky` "se pega" dentro de los límites de su
          contenedor de bloque más cercano — por eso la clase que lo
          muestra/oculta va en el MISMO nodo que `position:sticky`, nunca
          en un `<div>` envoltorio aparte que solo mide lo alto de la
          barra: si el contenedor termina ahí, no hay margen para que se
          quede pegada mientras se hace scroll por el resto de la página. */}
      <BarraFiltrosMovil resultados={total} className="filtros-barra-movil-envoltura">
        <PanelFiltros basePath={basePath} filtros={filtros} opcionesMarca={opcionesMarca} facetasAtributo={facetasAtributo} />
      </BarraFiltrosMovil>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,260px) minmax(0,1fr)", gap: 32, alignItems: "start" }} className="listado-grid">
        <div className="filtros-panel-escritorio">
          <PanelFiltros basePath={basePath} filtros={filtros} opcionesMarca={opcionesMarca} facetasAtributo={facetasAtributo} />
        </div>

        <div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
            <ChipsFiltrosActivos basePath={basePath} filtros={filtros} nombresMarca={nombresMarcaPorSlug} etiquetasAtributo={etiquetasAtributoPorClave} />
            <SelectOrden ordenActual={filtros.orden} />
          </div>

          <CuadriculaProductos
            productos={productos}
            vacio={{
              titulo: "No encontramos productos con esos filtros",
              hrefAccion: `${basePath}${serializarFiltros({ orden: filtros.orden })}`,
              textoAccion: "Quitar filtros",
            }}
          />

          <Paginacion
            paginaActual={pagina}
            totalPaginas={totalPaginas}
            construirHref={(p) => `${basePath}${serializarFiltros({ ...filtros, pagina: p })}`}
          />
        </div>
      </div>

      <style>{`
        .filtros-barra-movil-envoltura { display: none; }
        @media (max-width: 900px) {
          .listado-grid { grid-template-columns: 1fr !important; }
          .filtros-panel-escritorio { display: none; }
          .filtros-barra-movil-envoltura { display: block; }
        }
      `}</style>
    </section>
  );
}
