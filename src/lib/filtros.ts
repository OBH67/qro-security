import { esOrdenValido, type OrdenCatalogo } from "@/lib/constantes";

/**
 * Estado de los filtros del listado (A4), leído y escrito siempre desde la
 * URL (`searchParams`) para que sea compartible — criterio explícito de
 * A4: "el estado de los filtros se refleja en la URL".
 */
export interface FiltrosListado {
  marca: string[]; // slugs
  precioMin?: number;
  precioMax?: number;
  disponible: boolean;
  orden: OrdenCatalogo;
  pagina: number;
}

export type SearchParamsCrudos = Record<string, string | string[] | undefined>;

function unaCadena(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export function leerFiltros(searchParams: SearchParamsCrudos): FiltrosListado {
  const marcaCruda = unaCadena(searchParams.marca);
  const ordenCrudo = unaCadena(searchParams.orden) ?? null;
  const precioMinCrudo = unaCadena(searchParams.precio_min);
  const precioMaxCrudo = unaCadena(searchParams.precio_max);
  const paginaCruda = unaCadena(searchParams.pagina);

  return {
    marca: marcaCruda ? marcaCruda.split(",").filter(Boolean) : [],
    precioMin: precioMinCrudo ? Number(precioMinCrudo) || undefined : undefined,
    precioMax: precioMaxCrudo ? Number(precioMaxCrudo) || undefined : undefined,
    disponible: unaCadena(searchParams.disponible) === "1",
    orden: esOrdenValido(ordenCrudo) ? ordenCrudo : "vendidos",
    pagina: paginaCruda ? Math.max(1, Number(paginaCruda) || 1) : 1,
  };
}

/** Arma el query string a partir del estado de filtros, omitiendo los
 * valores por default para que la URL quede corta y legible. */
export function serializarFiltros(filtros: Partial<FiltrosListado>): string {
  const params = new URLSearchParams();
  if (filtros.marca && filtros.marca.length > 0) params.set("marca", filtros.marca.join(","));
  if (filtros.precioMin != null) params.set("precio_min", String(filtros.precioMin));
  if (filtros.precioMax != null) params.set("precio_max", String(filtros.precioMax));
  if (filtros.disponible) params.set("disponible", "1");
  if (filtros.orden && filtros.orden !== "vendidos") params.set("orden", filtros.orden);
  if (filtros.pagina && filtros.pagina !== 1) params.set("pagina", String(filtros.pagina));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function alternarMarca(filtros: FiltrosListado, slug: string): FiltrosListado {
  const activa = filtros.marca.includes(slug);
  return {
    ...filtros,
    marca: activa ? filtros.marca.filter((m) => m !== slug) : [...filtros.marca, slug],
    pagina: 1,
  };
}

export function alternarDisponible(filtros: FiltrosListado): FiltrosListado {
  return { ...filtros, disponible: !filtros.disponible, pagina: 1 };
}

export function quitarFiltro(
  filtros: FiltrosListado,
  tipo: "marca" | "precio" | "disponible",
  valor?: string,
): FiltrosListado {
  if (tipo === "marca" && valor) {
    return { ...filtros, marca: filtros.marca.filter((m) => m !== valor), pagina: 1 };
  }
  if (tipo === "precio") {
    return { ...filtros, precioMin: undefined, precioMax: undefined, pagina: 1 };
  }
  if (tipo === "disponible") {
    return { ...filtros, disponible: false, pagina: 1 };
  }
  return filtros;
}

export function sinFiltros(filtros: FiltrosListado): FiltrosListado {
  return { marca: [], disponible: false, orden: filtros.orden, pagina: 1 };
}
