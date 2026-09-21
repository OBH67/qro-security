import { esOrdenValido, type OrdenCatalogo } from "@/lib/constantes";
import type { CondicionProducto } from "@/types/database";

const CONDICIONES_FILTRABLES: readonly CondicionProducto[] = ["nuevo", "caja_abierta"];
const PREFIJO_ATRIBUTO = "attr_";

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
  /** "Promociones": nuevo / caja abierta — un producto usado no tiene
   * toggle propio (no es una condición que el negocio promueva buscar). */
  condicion: CondicionProducto[];
  /** Atributos dinámicos por categoría (`category_attributes.filterable`,
   * D1/PA-17) — clave del atributo → valores elegidos. */
  atributos: Record<string, string[]>;
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
  const condicionCruda = unaCadena(searchParams.condicion);

  const atributos: Record<string, string[]> = {};
  for (const [nombre, valor] of Object.entries(searchParams)) {
    if (!nombre.startsWith(PREFIJO_ATRIBUTO)) continue;
    const clave = nombre.slice(PREFIJO_ATRIBUTO.length);
    const cadena = unaCadena(valor);
    if (clave && cadena) atributos[clave] = cadena.split(",").filter(Boolean);
  }

  return {
    marca: marcaCruda ? marcaCruda.split(",").filter(Boolean) : [],
    precioMin: precioMinCrudo ? Number(precioMinCrudo) || undefined : undefined,
    precioMax: precioMaxCrudo ? Number(precioMaxCrudo) || undefined : undefined,
    disponible: unaCadena(searchParams.disponible) === "1",
    condicion: condicionCruda
      ? (condicionCruda.split(",").filter((c): c is CondicionProducto => (CONDICIONES_FILTRABLES as string[]).includes(c)))
      : [],
    atributos,
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
  if (filtros.condicion && filtros.condicion.length > 0) params.set("condicion", filtros.condicion.join(","));
  if (filtros.atributos) {
    for (const [clave, valores] of Object.entries(filtros.atributos)) {
      if (valores.length > 0) params.set(`${PREFIJO_ATRIBUTO}${clave}`, valores.join(","));
    }
  }
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

export function alternarCondicion(filtros: FiltrosListado, valor: CondicionProducto): FiltrosListado {
  const activa = filtros.condicion.includes(valor);
  return {
    ...filtros,
    condicion: activa ? filtros.condicion.filter((c) => c !== valor) : [...filtros.condicion, valor],
    pagina: 1,
  };
}

export function alternarAtributo(filtros: FiltrosListado, clave: string, valor: string): FiltrosListado {
  const actuales = filtros.atributos[clave] ?? [];
  const activo = actuales.includes(valor);
  const nuevos = activo ? actuales.filter((v) => v !== valor) : [...actuales, valor];
  const atributos = { ...filtros.atributos };
  if (nuevos.length > 0) atributos[clave] = nuevos;
  else delete atributos[clave];
  return { ...filtros, atributos, pagina: 1 };
}

export function quitarFiltro(
  filtros: FiltrosListado,
  tipo: "marca" | "precio" | "disponible" | "condicion" | "atributo",
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
  if (tipo === "condicion" && valor) {
    return { ...filtros, condicion: filtros.condicion.filter((c) => c !== valor), pagina: 1 };
  }
  if (tipo === "atributo" && valor) {
    const [clave, val] = valor.split(":");
    return alternarAtributo(filtros, clave, val);
  }
  return filtros;
}

export function sinFiltros(filtros: FiltrosListado): FiltrosListado {
  return { marca: [], disponible: false, condicion: [], atributos: {}, orden: filtros.orden, pagina: 1 };
}
