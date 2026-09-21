/**
 * Utilidades de formato compartidas por servidor y cliente. Código puro,
 * sin dependencias de React/Next/Supabase (arquitectura.md §4, `src/lib/`).
 *
 * Las reglas de aquí traducen literalmente la lógica de `index.html`:
 * - `money()` → `Component.money()` (index.html:2008)
 * - `stockLabel()` / `stockBars()` → `Component.stockLabel()` / `bars()` (index.html:2030-2041)
 */

const REGLAS_STOCK_BAJO = 3;
const REGLAS_STOCK_ALTO = 10;
const REGLAS_STOCK_MEDIO = 6;

/** Formatea un precio en pesos mexicanos, siempre con 2 decimales. */
export function formatearPrecio(valor: number | string): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return (
    "$" +
    n.toLocaleString("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** Piezas disponibles = stock físico − piezas apartadas (modelo-datos.md §1). */
export function stockDisponible(stock: number, reserved: number): number {
  return Math.max(0, stock - reserved);
}

/** index.html:2037 — reglas de etiqueta de stock (hallazgo #18 de modelo-datos.md). */
export function etiquetaStock(disponible: number): string {
  if (disponible === 0) return "Agotado";
  if (disponible <= REGLAS_STOCK_BAJO) return `Últimas ${disponible} piezas`;
  return `${disponible} disponibles`;
}

export type NivelStock = "agotado" | "bajo" | "normal";

export function nivelStock(disponible: number): NivelStock {
  if (disponible === 0) return "agotado";
  if (disponible <= REGLAS_STOCK_BAJO) return "bajo";
  return "normal";
}

/** index.html:2030-2036 — 4 barras del indicador visual de existencias. */
export function barrasStock(disponible: number): boolean[] {
  const n =
    disponible === 0
      ? 0
      : disponible >= REGLAS_STOCK_ALTO
        ? 4
        : disponible >= REGLAS_STOCK_MEDIO
          ? 3
          : disponible >= 3
            ? 2
            : 1;
  return [0, 1, 2, 3].map((i) => i < n);
}

/** Trunca a un número de renglones visibles, usado en nombres de producto. */
export function truncar(texto: string, maxCaracteres: number): string {
  if (texto.length <= maxCaracteres) return texto;
  return texto.slice(0, maxCaracteres - 1).trimEnd() + "…";
}
