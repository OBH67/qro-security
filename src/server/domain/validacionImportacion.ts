/**
 * F2.2 — valida cada fila del CSV contra las reglas de negocio y el
 * catálogo actual. Código puro (arquitectura.md §4, regla de dependencia
 * #2): recibe el catálogo ya cargado, no toca Supabase — así se puede
 * probar sin infraestructura.
 */
import type { ModoImportacion, FilaCsvCruda } from "./csvImportador";

export interface CatalogoParaValidar {
  skusExistentes: Set<string>;
  gruposPorNombre: Map<string, string>; // nombre en minúsculas → id
  subcategoriasPorNombre: Map<string, { id: string; groupId: string }>; // nombre en minúsculas → { id, groupId }
}

export interface FilaValidada {
  numeroFila: number;
  sku: string;
  nombre: string;
  precio: string;
  stock: string;
  ok: boolean;
  esNueva: boolean;
  motivo: string;
  ofrecerCrearSubcategoria?: string; // nombre de la subcategoría a crear, si aplica
  // Fila cruda completa (incluye marca/grupo/subcategoria/estado/descripcion,
  // no solo los 4 campos de arriba que se muestran en la tabla de vista
  // previa) — el paso 3 ("Aplicar") la necesita completa y así evita
  // volver a leer o parsear el archivo.
  datos: Record<string, string>;
}

const ESTADOS_VALIDOS = new Set(["activo", "agotado", "descontinuado"]);

export function validarFilaImportacion(fila: FilaCsvCruda, modo: ModoImportacion, catalogo: CatalogoParaValidar): FilaValidada {
  const sku = fila.valores.sku ?? "";
  const nombre = fila.valores.nombre ?? "";
  const precio = fila.valores.precio ?? "";
  const stock = fila.valores.stock ?? "";
  const base = { numeroFila: fila.numeroFila, sku, nombre, precio, stock, datos: fila.valores };

  if (!sku.trim()) {
    return { ...base, ok: false, esNueva: false, motivo: "Falta el SKU. Es obligatorio." };
  }

  const esNueva = !catalogo.skusExistentes.has(sku);
  const requierePrecio = modo === "todo" || modo === "solo_precios";
  const requiereStock = modo === "todo" || modo === "solo_stock";

  if (esNueva && modo !== "todo") {
    return { ...base, ok: false, esNueva, motivo: `El SKU "${sku}" no existe todavía — para crear un producto nuevo, usa el modo "Todo el producto".` };
  }

  if (esNueva && !nombre.trim()) {
    return { ...base, ok: false, esNueva, motivo: "Falta el nombre. Es obligatorio para un producto nuevo." };
  }

  if (requierePrecio && precio.trim()) {
    if (!/^\d+(\.\d{1,2})?$/.test(precio.trim())) {
      return { ...base, ok: false, esNueva, motivo: `Precio: "${precio}" no es un número.` };
    }
  } else if (requierePrecio && esNueva) {
    return { ...base, ok: false, esNueva, motivo: "Falta el precio. Es obligatorio para un producto nuevo." };
  }

  if (requiereStock && stock.trim()) {
    if (!/^\d+$/.test(stock.trim())) {
      return { ...base, ok: false, esNueva, motivo: `Stock: "${stock}" no es un número entero.` };
    }
  }

  const estado = (fila.valores.estado ?? "").trim().toLowerCase();
  if (estado && !ESTADOS_VALIDOS.has(estado)) {
    return { ...base, ok: false, esNueva, motivo: `Estado: "${fila.valores.estado}" no es válido (activo, agotado o descontinuado).` };
  }

  if (modo === "todo" && esNueva) {
    const grupoNombre = (fila.valores.grupo ?? "").trim();
    const subNombre = (fila.valores.subcategoria ?? "").trim();
    if (!grupoNombre || !catalogo.gruposPorNombre.has(grupoNombre.toLowerCase())) {
      return { ...base, ok: false, esNueva, motivo: `El grupo "${grupoNombre || "(vacío)"}" no existe.` };
    }
    if (!subNombre) {
      return { ...base, ok: false, esNueva, motivo: "Falta la subcategoría. Es obligatoria para un producto nuevo." };
    }
    const sub = catalogo.subcategoriasPorNombre.get(subNombre.toLowerCase());
    const grupoId = catalogo.gruposPorNombre.get(grupoNombre.toLowerCase());
    if (!sub || sub.groupId !== grupoId) {
      return { ...base, ok: false, esNueva, motivo: `La subcategoría "${subNombre}" no existe.`, ofrecerCrearSubcategoria: subNombre };
    }
  }

  return { ...base, ok: true, esNueva, motivo: esNueva ? "Se crea" : "Se actualiza" };
}
