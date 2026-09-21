import {
  barrasStock,
  etiquetaStock,
  formatearPrecio,
  nivelStock,
  stockDisponible,
  type NivelStock,
} from "@/lib/formato";
import { urlImagenPublica } from "@/lib/imagenes";

/** Forma mínima de una fila de producto que alcanza para armar una tarjeta
 * (viene de `catalogo_productos`, de `buscar_productos()`, o de un `select`
 * normal sobre `products`). */
export interface FilaProductoParaTarjeta {
  id: string;
  sku: string;
  slug: string;
  name: string;
  price: string | number;
  stock: number;
  reserved: number;
  brand_id: string | null;
  condition: "nuevo" | "usado";
  condition_detail: string | null;
}

export interface ProductoTarjeta {
  id: string;
  sku: string;
  slug: string;
  name: string;
  precioFmt: string;
  marca: string | null;
  disponible: number;
  nivel: NivelStock;
  etiquetaStock: string;
  barras: boolean[];
  imagenUrl: string | null;
  esUsado: boolean;
  condicionDetalle: string | null;
}

/** Traduce una fila cruda de la base de datos a los datos que ya necesita
 * `TarjetaProducto` (molécula) para pintarse — equivalente a `Component.card()`
 * en `index.html:2043`. */
export function mapearTarjetaProducto(
  fila: FilaProductoParaTarjeta,
  opciones: {
    nombreMarca?: string | null;
    imagenUrl?: string | null;
  } = {},
): ProductoTarjeta {
  const disponible = stockDisponible(fila.stock, fila.reserved);
  return {
    id: fila.id,
    sku: fila.sku,
    slug: fila.slug,
    name: fila.name,
    precioFmt: formatearPrecio(fila.price),
    marca: opciones.nombreMarca ?? null,
    disponible,
    nivel: nivelStock(disponible),
    etiquetaStock: etiquetaStock(disponible),
    barras: barrasStock(disponible),
    imagenUrl: opciones.imagenUrl ? urlImagenPublica(opciones.imagenUrl) : null,
    esUsado: fila.condition === "usado",
    condicionDetalle: fila.condition_detail,
  };
}

export interface FilaEspecificacion {
  clave: string;
  valor: string;
}

/** Convierte `products.attributes` (JSONB) en pares clave-valor legibles
 * para la tabla de especificaciones (criterio A3.2: "editables por el
 * administrador, no un texto libre rígido"). Usa la etiqueta declarada en
 * `category_attributes` cuando existe; si no, prettifica la clave cruda en
 * vez de inventar una traducción. */
export function construirFilasEspecificaciones(
  attributes: Record<string, unknown>,
  etiquetasPorClave: Map<string, string>,
): FilaEspecificacion[] {
  return Object.entries(attributes)
    .filter(([, valor]) => valor !== null && valor !== undefined && valor !== "")
    .map(([clave, valor]) => ({
      clave: etiquetasPorClave.get(clave) ?? prettificarClave(clave),
      valor: Array.isArray(valor) ? valor.join(", ") : String(valor),
    }));
}

function prettificarClave(clave: string): string {
  const conEspacios = clave.replace(/_/g, " ");
  return conEspacios.charAt(0).toUpperCase() + conEspacios.slice(1);
}
