import {
  barrasStock,
  etiquetaStock,
  formatearPrecio,
  nivelStock,
  stockDisponible,
  type NivelStock,
} from "@/lib/formato";
import { urlImagenPublica } from "@/lib/imagenes";
import type { CondicionProducto } from "@/types/database";

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
  condition: CondicionProducto;
  condition_detail: string | null;
  /** Solo presente cuando la consulta la trae (p. ej. "Más vendidos" de la
   * portada) — de aquí salen las chips de especificaciones cortas,
   * equivalente a `p.specs` de `index.html:380-417`. */
  attributes?: Record<string, unknown> | null;
}

export interface ProductoTarjeta {
  id: string;
  sku: string;
  slug: string;
  name: string;
  precio: number;
  precioFmt: string;
  marca: string | null;
  disponible: number;
  nivel: NivelStock;
  etiquetaStock: string;
  barras: boolean[];
  imagenUrl: string | null;
  condicion: CondicionProducto;
  esUsado: boolean;
  esCajaAbierta: boolean;
  condicionDetalle: string | null;
  /** Hasta 3 valores cortos de la ficha técnica, para la chip-row que
   * `index.html:389-393` pinta en "Más vendidos". Vacío si la tarjeta no
   * trae `attributes` (la mayoría de los listados no las necesita). */
  specs: string[];
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
    precio: typeof fila.price === "string" ? Number(fila.price) : fila.price,
    precioFmt: formatearPrecio(fila.price),
    marca: opciones.nombreMarca ?? null,
    disponible,
    nivel: nivelStock(disponible),
    etiquetaStock: etiquetaStock(disponible),
    barras: barrasStock(disponible),
    imagenUrl: opciones.imagenUrl ? urlImagenPublica(opciones.imagenUrl) : null,
    condicion: fila.condition,
    esUsado: fila.condition === "usado",
    esCajaAbierta: fila.condition === "caja_abierta",
    condicionDetalle: fila.condition_detail,
    specs: extraerSpecsCortas(fila.attributes),
  };
}

const MAX_SPECS_TARJETA = 3;
const MAX_LARGO_SPEC = 18;

function extraerSpecsCortas(attributes: Record<string, unknown> | null | undefined): string[] {
  if (!attributes) return [];
  const valores: string[] = [];
  for (const valor of Object.values(attributes)) {
    if (valor === null || valor === undefined || valor === "") continue;
    const texto = Array.isArray(valor) ? valor.join(", ") : String(valor);
    if (texto.length > MAX_LARGO_SPEC) continue; // las chips son cortas, no una oración
    valores.push(texto);
    if (valores.length >= MAX_SPECS_TARJETA) break;
  }
  return valores;
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
