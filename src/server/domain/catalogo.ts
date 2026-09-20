// Lógica de dominio del catálogo: árbol de subcategorías (D7,
// modelo-datos.md §3). Código puro — no importa React, Next ni Supabase
// (arquitectura.md §4, regla de dependencia #2), para poder probarse sin
// base de datos y para que `src/server/db/queries/catalogo.ts` lo use tras
// traer las filas.

import type { SubcategoryRow } from "@/types/database";

export interface NodoSubcategoria extends SubcategoryRow {
  hijos: NodoSubcategoria[];
}

/** Arma el árbol (raíces = subcategorías de primer nivel) a partir de la
 * lista plana de un grupo. `filas` puede venir en cualquier orden. */
export function construirArbolSubcategorias(
  filas: SubcategoryRow[],
): NodoSubcategoria[] {
  const porId = new Map<string, NodoSubcategoria>(
    filas.map((f): [string, NodoSubcategoria] => [f.id, { ...f, hijos: [] }]),
  );
  const raices: NodoSubcategoria[] = [];

  for (const fila of filas) {
    const nodo = porId.get(fila.id)!;
    if (fila.parent_id && porId.has(fila.parent_id)) {
      porId.get(fila.parent_id)!.hijos.push(nodo);
    } else {
      raices.push(nodo);
    }
  }

  const ordenar = (nodos: NodoSubcategoria[]) => {
    nodos.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
    nodos.forEach((n) => ordenar(n.hijos));
  };
  ordenar(raices);

  return raices;
}

export interface RutaSubcategoriaResuelta {
  /** Cadena completa desde el primer nivel hasta la hoja, en orden. */
  cadena: SubcategoryRow[];
  hoja: SubcategoryRow;
}

/** Resuelve una ruta de slugs (1 a 3 niveles) contra el árbol de un grupo.
 * Regresa `null` si algún segmento no corresponde a un hijo válido del
 * anterior — nunca "adivina" el nivel más cercano. */
export function resolverRutaSubcategoria(
  filas: SubcategoryRow[],
  segmentosSlug: string[],
): RutaSubcategoriaResuelta | null {
  if (segmentosSlug.length === 0) return null;

  const porPadre = new Map<string | null, SubcategoryRow[]>();
  for (const fila of filas) {
    const lista = porPadre.get(fila.parent_id) ?? [];
    lista.push(fila);
    porPadre.set(fila.parent_id, lista);
  }

  const cadena: SubcategoryRow[] = [];
  let padreActual: string | null = null;

  for (const slug of segmentosSlug) {
    const candidatas: SubcategoryRow[] = porPadre.get(padreActual) ?? [];
    const encontrada: SubcategoryRow | undefined = candidatas.find(
      (c: SubcategoryRow) => c.slug === slug,
    );
    if (!encontrada) return null;
    cadena.push(encontrada);
    padreActual = encontrada.id;
  }

  return { cadena, hoja: cadena[cadena.length - 1] };
}

/** IDs de una subcategoría y de todos sus descendientes (incluida ella
 * misma) — es el conjunto sobre el que se filtran productos, porque un
 * producto siempre cuelga de la hoja más específica (modelo-datos.md §4.2),
 * nunca de un nodo intermedio. */
export function idsSubcategoriaConDescendientes(
  filas: SubcategoryRow[],
  subcategoriaId: string,
): string[] {
  const hijosDe = new Map<string, string[]>();
  for (const fila of filas) {
    if (!fila.parent_id) continue;
    const lista = hijosDe.get(fila.parent_id) ?? [];
    lista.push(fila.id);
    hijosDe.set(fila.parent_id, lista);
  }

  const resultado: string[] = [];
  const pila = [subcategoriaId];
  while (pila.length > 0) {
    const actual = pila.pop()!;
    resultado.push(actual);
    for (const hijoId of hijosDe.get(actual) ?? []) pila.push(hijoId);
  }
  return resultado;
}

/** Cuenta cuántos nodos raíz (primer nivel) tiene el grupo — usado para
 * mostrar "N subcategorías" en la navegación. */
export function contarSubcategoriasRaiz(filas: SubcategoryRow[]): number {
  return filas.filter((f) => f.parent_id === null).length;
}
