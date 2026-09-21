/** Constantes compartidas del catálogo público (Épica A). */

export const PRODUCTOS_POR_PAGINA = 24;
export const PRODUCTOS_DESTACADOS_GRUPO = 4;
export const PRODUCTOS_RELACIONADOS = 4;
export const PRODUCTOS_MAS_VENDIDOS_HOME = 5;
export const SUGERENCIAS_BUSQUEDA_MAX = 5;

export const ORDENES_CATALOGO = [
  "vendidos",
  "precio_asc",
  "precio_desc",
  "novedades",
] as const;
export type OrdenCatalogo = (typeof ORDENES_CATALOGO)[number];

export const ETIQUETA_ORDEN: Record<OrdenCatalogo, string> = {
  vendidos: "Más vendidos",
  precio_asc: "Menor precio",
  precio_desc: "Mayor precio",
  novedades: "Novedades",
};

export function esOrdenValido(valor: string | null): valor is OrdenCatalogo {
  return !!valor && (ORDENES_CATALOGO as readonly string[]).includes(valor);
}
