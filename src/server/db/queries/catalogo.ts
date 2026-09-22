import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import {
  construirArbolSubcategorias,
  idsSubcategoriaConDescendientes,
  resolverRutaSubcategoria,
  type NodoSubcategoria,
} from "@/server/domain/catalogo";
import {
  PRODUCTOS_MAS_VENDIDOS_HOME,
  PRODUCTOS_POR_PAGINA,
  type OrdenCatalogo,
} from "@/lib/constantes";
import { formatearPrecio } from "@/lib/formato";
import { urlImagenPublica } from "@/lib/imagenes";
import type {
  BannerRow,
  BrandRow,
  BuscarProductosRow,
  CategoryAttributeRow,
  CondicionProducto,
  FaqRow,
  GroupRow,
  ProductDocumentRow,
  ProductImageRow,
  ReviewRow,
  SubcategoryRow,
} from "@/types/database";

/**
 * Capa de acceso a datos del catálogo — solo lecturas (arquitectura.md §4,
 * "los Server Components sí pueden llamar directamente a
 * src/server/db/queries/"). Usa siempre el cliente con sesión (respeta
 * RLS); el catálogo público no necesita el cliente service_role.
 */

// ─────────────────────────────────────────────────────────────────────────
// Grupos y subcategorías (A1)
// ─────────────────────────────────────────────────────────────────────────

export async function obtenerGrupos(): Promise<GroupRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los grupos: ${error.message}`);
  return data ?? [];
}

export async function obtenerGrupoPorSlug(slug: string): Promise<GroupRow | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el grupo: ${error.message}`);
  return data;
}

/** Todas las subcategorías (los 3 niveles) de un grupo, planas. Es un
 * dataset chico (decenas de filas por grupo) — el árbol se arma en
 * `src/server/domain/catalogo.ts`, sin necesidad de una consulta recursiva. */
export async function obtenerSubcategoriasDeGrupo(
  groupId: string,
): Promise<SubcategoryRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("group_id", groupId)
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las subcategorías: ${error.message}`);
  return data ?? [];
}

export async function obtenerArbolSubcategorias(
  groupId: string,
): Promise<NodoSubcategoria[]> {
  const filas = await obtenerSubcategoriasDeGrupo(groupId);
  return construirArbolSubcategorias(filas);
}

/** Nodo de navegación del mega-menú/menú móvil: mismo árbol de
 * `NodoSubcategoria` pero solo con los campos que la UI necesita, para no
 * acoplar el componente al tipo de fila cruda de la base de datos. */
export interface NodoNavegacionSubcategoria {
  slug: string;
  name: string;
  hijos: NodoNavegacionSubcategoria[];
}

function aNodoNavegacion(nodo: NodoSubcategoria): NodoNavegacionSubcategoria {
  return { slug: nodo.slug, name: nodo.name, hijos: nodo.hijos.map(aNodoNavegacion) };
}

export interface GrupoConNavegacion {
  id: string;
  slug: string;
  name: string;
  code: string;
  /** Árbol completo (hasta 3 niveles, D7 modelo-datos.md §3), no solo la
   * raíz — el mega-menú y el menú móvil deben poder mostrar los 3 niveles. */
  subcategoriasRaiz: NodoNavegacionSubcategoria[];
  /** index.html:212-221 — panel "DESTACADO" del mega-menú: un producto por
   * grupo (el más vendido). `null` si el grupo todavía no tiene productos
   * activos, en vez de inventar uno. */
  destacado: { slug: string; name: string; priceFmt: string; imagenUrl: string | null } | null;
}

/** Los 6 grupos + su árbol completo de subcategorías, para el menú principal
 * (mega-menú de escritorio y menú de pantalla completa en móvil — A1.1).
 * Es un dataset chico (grupos × hasta ~3 niveles de subcategorías): se
 * resuelve con una consulta por grupo, aceptable a esta escala (6 grupos). */
export async function obtenerNavegacionGrupos(): Promise<GrupoConNavegacion[]> {
  const grupos = await obtenerGrupos();
  return Promise.all(
    grupos.map(async (grupo) => {
      const [subs, destacados] = await Promise.all([
        obtenerSubcategoriasDeGrupo(grupo.id),
        obtenerDestacadosDeGrupo(grupo.id, 1),
      ]);

      let destacado: GrupoConNavegacion["destacado"] = null;
      const crudo = destacados[0];
      if (crudo) {
        const imagenes = await obtenerImagenesPrincipales([crudo.id]);
        const claveImagen = imagenes.get(crudo.id);
        destacado = {
          slug: crudo.slug,
          name: crudo.name,
          priceFmt: formatearPrecio(crudo.price),
          imagenUrl: claveImagen ? urlImagenPublica(claveImagen) : null,
        };
      }

      return {
        id: grupo.id,
        slug: grupo.slug,
        name: grupo.name,
        code: grupo.code,
        subcategoriasRaiz: construirArbolSubcategorias(subs).map(aNodoNavegacion),
        destacado,
      };
    }),
  );
}

export interface RutaResuelta {
  grupo: GroupRow;
  cadena: SubcategoryRow[];
  hoja: SubcategoryRow;
  idsAlcance: string[];
}

/** Resuelve `/catalogo/[grupo]/[...subcategoria]` contra la taxonomía real.
 * Regresa `null` si el grupo no existe o la ruta de slugs no es válida —
 * nunca inventa una coincidencia parcial. */
export async function resolverRutaCatalogo(
  grupoSlug: string,
  segmentosSubcategoria: string[],
): Promise<RutaResuelta | null> {
  const grupo = await obtenerGrupoPorSlug(grupoSlug);
  if (!grupo) return null;

  const filas = await obtenerSubcategoriasDeGrupo(grupo.id);
  const resuelto = resolverRutaSubcategoria(filas, segmentosSubcategoria);
  if (!resuelto) return null;

  return {
    grupo,
    cadena: resuelto.cadena,
    hoja: resuelto.hoja,
    idsAlcance: idsSubcategoriaConDescendientes(filas, resuelto.hoja.id),
  };
}

export interface SubcategoriaHija {
  id: string;
  slug: string;
  name: string;
  conteo: number;
}

/** Hijas directas de un nodo del árbol (D7) con conteo de productos
 * activos, incluyendo a sus propios descendientes — `parentId: null`
 * regresa las categorías raíz de un grupo; `parentId: <id de una
 * subcategoría>` regresa sus hijas directas (el "nivel siguiente" del
 * filtro "Categorías" del panel). */
export async function obtenerSubcategoriasHijas(groupId: string, parentId: string | null): Promise<SubcategoriaHija[]> {
  const filas = await obtenerSubcategoriasDeGrupo(groupId);
  const hijas = filas.filter((f) => f.parent_id === parentId).sort((a, b) => a.position - b.position);
  if (hijas.length === 0) return [];

  const supabase = await crearClienteServidor();
  const resultados = await Promise.all(
    hijas.map(async (hija) => {
      const ids = idsSubcategoriaConDescendientes(filas, hija.id);
      const { count, error } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "activo").in("subcategory_id", ids);
      if (error) throw new Error(`No se pudo contar productos: ${error.message}`);
      return { id: hija.id, slug: hija.slug, name: hija.name, conteo: count ?? 0 };
    }),
  );
  return resultados;
}

// ─────────────────────────────────────────────────────────────────────────
// Marcas (filtros de A4 y marquesina de marcas de la portada)
// ─────────────────────────────────────────────────────────────────────────

export async function obtenerMarcasActivas(): Promise<BrandRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las marcas: ${error.message}`);
  return data ?? [];
}

export interface OpcionMarca {
  slug: string;
  name: string;
  cantidad: number;
}

/** Marcas presentes en el alcance actual (grupo/subcategoría) con conteo,
 * para la faceta "Marca" del panel de filtros (A4). Solo cuenta columnas
 * angostas (`brand_id`) — a la escala de este catálogo (~1,050 SKU) es
 * más simple y suficientemente rápido que mantener una vista agregada. */
export async function obtenerOpcionesMarca(params: {
  groupId?: string;
  subcategoryIds?: string[];
}): Promise<OpcionMarca[]> {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("catalogo_productos")
    .select("brand_id")
    .not("brand_id", "is", null);

  if (params.groupId) consulta = consulta.eq("group_id", params.groupId);
  if (params.subcategoryIds) consulta = consulta.in("subcategory_id", params.subcategoryIds);

  const { data, error } = await consulta;
  if (error) throw new Error(`No se pudieron cargar las marcas del catálogo: ${error.message}`);

  const conteoPorMarca = new Map<string, number>();
  for (const fila of data ?? []) {
    if (!fila.brand_id) continue;
    conteoPorMarca.set(fila.brand_id, (conteoPorMarca.get(fila.brand_id) ?? 0) + 1);
  }
  if (conteoPorMarca.size === 0) return [];

  const marcas = await obtenerMarcasActivas();
  return marcas
    .filter((m) => conteoPorMarca.has(m.id))
    .map((m) => ({ slug: m.slug, name: m.name, cantidad: conteoPorMarca.get(m.id)! }))
    .sort((a, b) => b.cantidad - a.cantidad || a.name.localeCompare(b.name));
}

// ─────────────────────────────────────────────────────────────────────────
// Listado de productos (A1, A4)
// ─────────────────────────────────────────────────────────────────────────

const CLAVE_ATRIBUTO_VALIDA = /^[a-z0-9_]+$/;

export interface ParametrosListado {
  groupId?: string;
  subcategoryIds?: string[];
  marcaIds?: string[];
  precioMin?: number;
  precioMax?: number;
  soloDisponibles?: boolean;
  /** "Promociones" del panel de filtros (nuevo/caja abierta). */
  condiciones?: CondicionProducto[];
  /** Atributos dinámicos filtrables (D1/PA-17) — clave → valores elegidos,
   * combinados en AND entre distintas claves y OR dentro de la misma. Solo
   * se aceptan claves que ya vinieron de `obtenerAtributosFiltrables()`
   * (`CLAVE_ATRIBUTO_VALIDA` es un candado extra, nunca la única defensa,
   * porque la clave se interpola en la ruta de la columna JSON). */
  atributos?: Record<string, string[]>;
  orden: OrdenCatalogo;
  pagina: number;
}

export interface ResultadoListado {
  productos: Array<{
    id: string;
    sku: string;
    slug: string;
    name: string;
    price: string;
    stock: number;
    reserved: number;
    brand_id: string | null;
    condition: CondicionProducto;
    condition_detail: string | null;
  }>;
  total: number;
  totalPaginas: number;
  pagina: number;
}

function ordenA(consulta: ReturnType<typeof construirConsultaListado>, orden: OrdenCatalogo) {
  switch (orden) {
    case "precio_asc":
      return consulta.order("price", { ascending: true });
    case "precio_desc":
      return consulta.order("price", { ascending: false });
    case "novedades":
      return consulta.order("created_at", { ascending: false });
    case "vendidos":
    default:
      return consulta.order("sales_count", { ascending: false });
  }
}

function construirConsultaListado(
  supabase: Awaited<ReturnType<typeof crearClienteServidor>>,
) {
  return supabase
    .from("catalogo_productos")
    .select(
      "id, sku, slug, name, price, stock, reserved, brand_id, condition, condition_detail",
      { count: "exact" },
    );
}

/** Listado paginado desde la base de datos (criterio A1.5: nunca se cargan
 * los ~1,050 productos de golpe) con filtros combinables reflejados en la
 * URL por quien llama a esta función (criterio A4). */
export async function listarProductos(
  params: ParametrosListado,
): Promise<ResultadoListado> {
  const supabase = await crearClienteServidor();
  let consulta = construirConsultaListado(supabase);

  if (params.groupId) consulta = consulta.eq("group_id", params.groupId);
  if (params.subcategoryIds) consulta = consulta.in("subcategory_id", params.subcategoryIds);
  if (params.marcaIds && params.marcaIds.length > 0) {
    consulta = consulta.in("brand_id", params.marcaIds);
  }
  if (params.precioMin != null) consulta = consulta.gte("price", params.precioMin);
  if (params.precioMax != null) consulta = consulta.lte("price", params.precioMax);
  if (params.soloDisponibles) consulta = consulta.gt("disponible", 0);
  if (params.condiciones && params.condiciones.length > 0) consulta = consulta.in("condition", params.condiciones);
  if (params.atributos) {
    for (const [clave, valores] of Object.entries(params.atributos)) {
      if (!CLAVE_ATRIBUTO_VALIDA.test(clave) || valores.length === 0) continue;
      consulta = consulta.in(`attributes->>${clave}`, valores);
    }
  }

  consulta = ordenA(consulta, params.orden);

  const pagina = Math.max(1, params.pagina);
  const desde = (pagina - 1) * PRODUCTOS_POR_PAGINA;
  const hasta = desde + PRODUCTOS_POR_PAGINA - 1;
  consulta = consulta.range(desde, hasta);

  const { data, error, count } = await consulta;
  if (error) throw new Error(`No se pudo cargar el listado de productos: ${error.message}`);

  const total = count ?? 0;
  return {
    productos: data ?? [],
    total,
    totalPaginas: Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA)),
    pagina,
  };
}

/** Productos destacados de un grupo para su página de aterrizaje (isGroup). */
export async function obtenerDestacadosDeGrupo(groupId: string, limite: number) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("catalogo_productos")
    .select("id, sku, slug, name, price, stock, reserved, brand_id, condition, condition_detail")
    .eq("group_id", groupId)
    .order("sales_count", { ascending: false })
    .limit(limite);

  if (error) throw new Error(`No se pudieron cargar los destacados: ${error.message}`);
  return data ?? [];
}

/** index.html:380-417 — "Más vendidos" de la portada, con `attributes` de
 * más (para las chips de especificaciones `p.specs` del demo, que ahí eran
 * datos fijos: aquí son las primeras claves reales de la ficha técnica). */
export async function obtenerMasVendidos(limite = PRODUCTOS_MAS_VENDIDOS_HOME) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("catalogo_productos")
    .select("id, sku, slug, name, price, stock, reserved, brand_id, condition, condition_detail, attributes")
    .order("sales_count", { ascending: false })
    .limit(limite);

  if (error) throw new Error(`No se pudieron cargar los más vendidos: ${error.message}`);
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────
// "Para Ti" (index.html:340-372) — pestañas por subcategoría con carrusel
// ─────────────────────────────────────────────────────────────────────────

export interface PestanaParaTi {
  subcategoriaId: string;
  nombre: string;
  href: string;
  productos: {
    id: string;
    sku: string;
    slug: string;
    name: string;
    price: string | number;
    stock: number;
    reserved: number;
    brand_id: string | null;
    condition: CondicionProducto;
    condition_detail: string | null;
  }[];
}

/** El demo arma las pestañas a partir de las subcategorías que de verdad
 * tienen productos, en el orden en que aparecen en el catálogo (index.html:
 * 2076-2088, `ptTabList()`). Aquí se usa el mismo criterio sobre datos
 * reales: subcategorías raíz (con sus descendientes) que tienen al menos
 * un producto activo, ordenadas por cuántos tienen (las más surtidas
 * primero), tope `limiteTabs`. */
export async function obtenerParaTi(limiteTabs = 8, limiteItemsPorTab = 9): Promise<PestanaParaTi[]> {
  const grupos = await obtenerGrupos();
  const supabase = await crearClienteServidor();

  const candidatos = (
    await Promise.all(
      grupos.map(async (grupo) => {
        const filas = await obtenerSubcategoriasDeGrupo(grupo.id);
        const raices = filas.filter((f) => f.parent_id === null);
        return raices.map((raiz) => ({
          grupo,
          raiz,
          ids: idsSubcategoriaConDescendientes(filas, raiz.id),
        }));
      }),
    )
  ).flat();

  const conConteo = await Promise.all(
    candidatos.map(async (c) => {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "activo")
        .in("subcategory_id", c.ids);
      if (error) throw new Error(`No se pudo contar productos de subcategoría: ${error.message}`);
      return { ...c, count: count ?? 0 };
    }),
  );

  const elegidos = conConteo
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limiteTabs);

  return Promise.all(
    elegidos.map(async (c): Promise<PestanaParaTi> => {
      const { data, error } = await supabase
        .from("catalogo_productos")
        .select("id, sku, slug, name, price, stock, reserved, brand_id, condition, condition_detail")
        .in("subcategory_id", c.ids)
        .order("sales_count", { ascending: false })
        .limit(limiteItemsPorTab);
      if (error) throw new Error(`No se pudieron cargar productos de "Para Ti": ${error.message}`);
      return {
        subcategoriaId: c.raiz.id,
        nombre: c.raiz.name,
        href: `/catalogo/${c.grupo.slug}/${c.raiz.slug}`,
        productos: data ?? [],
      };
    }),
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Imágenes (foto principal para tarjetas, galería completa para PDP)
// ─────────────────────────────────────────────────────────────────────────

/** Foto principal (`position` más baja) de cada producto de la lista. */
export async function obtenerImagenesPrincipales(
  productIds: string[],
): Promise<Map<string, string>> {
  if (productIds.length === 0) return new Map();
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", productIds)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las imágenes: ${error.message}`);

  const mapa = new Map<string, string>();
  for (const fila of data ?? []) {
    if (!mapa.has(fila.product_id)) mapa.set(fila.product_id, fila.url);
  }
  return mapa;
}

export async function obtenerGaleriaProducto(productId: string): Promise<ProductImageRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", productId)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudo cargar la galería: ${error.message}`);
  return data ?? [];
}

export async function obtenerDocumentosProducto(
  productId: string,
): Promise<ProductDocumentRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("product_documents")
    .select("*")
    .eq("product_id", productId);

  if (error) throw new Error(`No se pudieron cargar los documentos: ${error.message}`);
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────
// Ficha de producto (A3)
// ─────────────────────────────────────────────────────────────────────────

export interface ProductoDetalle {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string | null;
  price: string;
  tax_rate: string;
  stock: number;
  reserved: number;
  warranty_months: number;
  weight_kg: string | null;
  includes: string[] | null;
  attributes: Record<string, unknown>;
  condition: CondicionProducto;
  condition_detail: string | null;
  brand: { id: string; name: string; slug: string } | null;
  grupo: GroupRow;
  subcategoria: SubcategoryRow;
  cadenaSubcategorias: SubcategoryRow[];
}

/** Producto activo por slug, ya nunca visible por URL directa si está
 * inactivo (criterio A1.4: la política `products_select_active` de RLS lo
 * filtra en la base de datos, no en la aplicación). */
export async function obtenerProductoPorSlug(slug: string): Promise<ProductoDetalle | null> {
  const supabase = await crearClienteServidor();
  const { data: producto, error } = await supabase
    .from("products")
    .select(
      "id, sku, slug, name, description, price, tax_rate, stock, reserved, warranty_months, weight_kg, includes, attributes, condition, condition_detail, brand_id, group_id, subcategory_id, status",
    )
    .eq("slug", slug)
    .eq("status", "activo")
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`);
  if (!producto) return null;

  const [{ data: grupo }, { data: subcategoria }, { data: marca }] = await Promise.all([
    supabase.from("groups").select("*").eq("id", producto.group_id).maybeSingle(),
    supabase.from("subcategories").select("*").eq("id", producto.subcategory_id).maybeSingle(),
    producto.brand_id
      ? supabase.from("brands").select("id, name, slug").eq("id", producto.brand_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  if (!grupo || !subcategoria) return null;

  const todasLasSubs = await obtenerSubcategoriasDeGrupo(grupo.id);
  const cadenaSubcategorias = construirCadenaHaciaRaiz(todasLasSubs, subcategoria.id);

  return {
    id: producto.id,
    sku: producto.sku,
    slug: producto.slug,
    name: producto.name,
    description: producto.description,
    price: producto.price,
    tax_rate: producto.tax_rate,
    stock: producto.stock,
    reserved: producto.reserved,
    warranty_months: producto.warranty_months,
    weight_kg: producto.weight_kg,
    includes: producto.includes,
    attributes: producto.attributes as Record<string, unknown>,
    condition: producto.condition,
    condition_detail: producto.condition_detail,
    brand: marca ?? null,
    grupo,
    subcategoria,
    cadenaSubcategorias,
  };
}

function construirCadenaHaciaRaiz(
  filas: SubcategoryRow[],
  subcategoriaId: string,
): SubcategoryRow[] {
  const porId = new Map(filas.map((f) => [f.id, f]));
  const cadena: SubcategoryRow[] = [];
  let actual = porId.get(subcategoriaId);
  while (actual) {
    cadena.unshift(actual);
    actual = actual.parent_id ? porId.get(actual.parent_id) : undefined;
  }
  return cadena;
}

/** Etiquetas legibles para las claves de `products.attributes` (D1,
 * `modelo-datos.md` §3) — declaradas por grupo o por subcategoría. Si una
 * clave no tiene fila aquí, la ficha de producto usa una versión
 * "prettificada" de la clave cruda en vez de inventar una traducción. */
export async function obtenerAtributosDeCategoria(params: {
  groupId: string;
  subcategoryId: string;
}): Promise<CategoryAttributeRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("category_attributes")
    .select("*")
    .or(`group_id.eq.${params.groupId},subcategory_id.eq.${params.subcategoryId}`)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los atributos de categoría: ${error.message}`);
  return data ?? [];
}

export interface OpcionAtributo {
  valor: string;
  cantidad: number;
}

export interface FacetaAtributo {
  key: string;
  label: string;
  opciones: OpcionAtributo[];
}

/** D1/PA-17: facetas dinámicas del panel de filtros — un grupo de
 * checkboxes por cada atributo marcado `filterable` en el alcance
 * (grupo o cualquiera de sus subcategorías visibles), con el conteo de
 * productos real en ese alcance. Mismo criterio que `obtenerOpcionesMarca`:
 * a la escala de este catálogo, contar en memoria es más simple que
 * mantener una vista agregada. */
export async function obtenerAtributosFiltrables(params: {
  groupId: string;
  subcategoryIds?: string[];
}): Promise<FacetaAtributo[]> {
  const supabase = await crearClienteServidor();

  let consultaDefiniciones = supabase.from("category_attributes").select("*").eq("filterable", true).eq("data_type", "text");
  consultaDefiniciones = params.subcategoryIds && params.subcategoryIds.length > 0
    ? consultaDefiniciones.or(`group_id.eq.${params.groupId},subcategory_id.in.(${params.subcategoryIds.join(",")})`)
    : consultaDefiniciones.eq("group_id", params.groupId);

  const { data: definiciones, error: errorDefiniciones } = await consultaDefiniciones.order("position", { ascending: true });
  if (errorDefiniciones) throw new Error(`No se pudieron cargar los atributos filtrables: ${errorDefiniciones.message}`);
  if (!definiciones || definiciones.length === 0) return [];

  let consultaProductos = supabase.from("catalogo_productos").select("attributes").eq("group_id", params.groupId);
  if (params.subcategoryIds) consultaProductos = consultaProductos.in("subcategory_id", params.subcategoryIds);
  const { data: productos, error: errorProductos } = await consultaProductos;
  if (errorProductos) throw new Error(`No se pudieron cargar los valores de atributos: ${errorProductos.message}`);

  return (definiciones as CategoryAttributeRow[])
    .map((def): FacetaAtributo => {
      const conteoPorValor = new Map<string, number>();
      for (const p of productos ?? []) {
        const valor = (p.attributes as Record<string, unknown> | null)?.[def.key];
        if (typeof valor !== "string" || !valor) continue;
        conteoPorValor.set(valor, (conteoPorValor.get(valor) ?? 0) + 1);
      }
      const universo: string[] = def.options && def.options.length > 0 ? def.options : [...conteoPorValor.keys()];
      const opciones: OpcionAtributo[] = universo
        .map((valor) => ({ valor, cantidad: conteoPorValor.get(valor) ?? 0 }))
        .filter((o) => o.cantidad > 0)
        .sort((a, b) => b.cantidad - a.cantidad);
      return { key: def.key, label: def.label, opciones };
    })
    .filter((f) => f.opciones.length > 0);
}

export async function obtenerRelacionados(params: {
  productId: string;
  subcategoryId: string;
  limite: number;
}) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("catalogo_productos")
    .select("id, sku, slug, name, price, stock, reserved, brand_id, condition, condition_detail")
    .eq("subcategory_id", params.subcategoryId)
    .neq("id", params.productId)
    .order("sales_count", { ascending: false })
    .limit(params.limite);

  if (error) throw new Error(`No se pudieron cargar los productos relacionados: ${error.message}`);
  return data ?? [];
}

// ─────────────────────────────────────────────────────────────────────────
// Búsqueda (A2)
// ─────────────────────────────────────────────────────────────────────────

export interface ResultadoBusqueda {
  productos: Array<{
    id: string;
    sku: string;
    slug: string;
    name: string;
    price: string;
    stock: number;
    reserved: number;
    brand_id: string | null;
    condition: CondicionProducto;
    condition_detail: string | null;
  }>;
  total: number;
  totalPaginas: number;
  pagina: number;
}

export async function buscarProductos(
  termino: string,
  pagina = 1,
): Promise<ResultadoBusqueda> {
  const supabase = await crearClienteServidor();
  const paginaSegura = Math.max(1, pagina);
  const desde = (paginaSegura - 1) * PRODUCTOS_POR_PAGINA;

  const { data, error } = await supabase.rpc("buscar_productos", {
    p_query: termino,
    p_limit: PRODUCTOS_POR_PAGINA,
    p_offset: desde,
  });

  if (error) throw new Error(`No se pudo completar la búsqueda: ${error.message}`);

  const filas: BuscarProductosRow[] = data ?? [];
  const total = filas[0]?.total_count ?? 0;
  return {
    productos: filas.map((f: BuscarProductosRow) => ({
      id: f.id,
      sku: f.sku,
      slug: f.slug,
      name: f.name,
      price: f.price,
      stock: f.stock,
      reserved: f.reserved,
      brand_id: f.brand_id,
      condition: f.condition,
      condition_detail: f.condition_detail,
    })),
    total,
    totalPaginas: Math.max(1, Math.ceil(total / PRODUCTOS_POR_PAGINA)),
    pagina: paginaSegura,
  };
}

/** Sugerencias en vivo del buscador (index.html:2210), acotadas a pocas
 * filas — se usa mientras la persona escribe, antes de llegar a `/buscar`. */
export async function obtenerSugerenciasBusqueda(termino: string, limite: number) {
  const resultado = await buscarProductos(termino, 1);
  return resultado.productos.slice(0, limite);
}

// ─────────────────────────────────────────────────────────────────────────
// Contenido de la portada (reseñas, banners, FAQs) — solo lo que ya tiene
// tabla aprobada en modelo-datos.md §4.6. PA-14/PA-15/PA-16 siguen abiertas
// sobre si esto lo edita el admin; aquí solo se lee lo que exista.
// ─────────────────────────────────────────────────────────────────────────

export async function obtenerReseñasPublicadas(limite: number): Promise<ReviewRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) throw new Error(`No se pudieron cargar las reseñas: ${error.message}`);
  return data ?? [];
}

/** Banners del carrusel de la portada (`BannerHero`) — `placement:
 * 'home'` (0021). Nunca se mezclan con los de catálogo: son destinos
 * distintos de la misma tabla, no la misma franja reutilizada en dos
 * lugares (bug real del decimoséptimo incremento: actualizar un banner
 * de categoría también cambiaba el carrusel de la portada). */
export async function obtenerBannersActivos(): Promise<BannerRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .eq("active", true)
    .eq("placement", "home")
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar los banners: ${error.message}`);
  return data ?? [];
}

/** Banner promocional para una página de catálogo (grupo o listado) —
 * `placement: 'catalogo'` (0021), completamente separado de los de la
 * portada. Primero uno propio del grupo; si no hay, uno genérico
 * (`group_id` nulo); si tampoco hay uno genérico, el primero activo —
 * la franja debe persistir en todas las secciones del catálogo, no solo
 * en las que ya tienen un banner propio asignado. `null` únicamente
 * cuando no hay ningún banner de catálogo activo, en vez de inventar
 * contenido. */
export async function obtenerBannerDeGrupo(groupId: string): Promise<BannerRow | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("banners").select("*").eq("active", true).eq("placement", "catalogo").order("position", { ascending: true });
  if (error) throw new Error(`No se pudieron cargar los banners de catálogo: ${error.message}`);

  const banners = data ?? [];
  if (banners.length === 0) return null;
  return banners.find((b) => b.group_id === groupId) ?? banners.find((b) => b.group_id === null) ?? banners[0];
}

export async function obtenerFaqsPorAmbito(
  scope: FaqRow["scope"],
): Promise<FaqRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("faqs")
    .select("*")
    .eq("scope", scope)
    .eq("active", true)
    .order("position", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar las preguntas frecuentes: ${error.message}`);
  return data ?? [];
}
