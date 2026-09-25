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

/** Separador de miles mientras se escribe un monto (ej. "Monto
 * transferido" del comprobante) — a diferencia de `formatearPrecio`, no
 * agrega "$" ni fuerza 2 decimales, porque el valor puede estar a medio
 * escribir (un "." final, un decimal incompleto). Recibe y regresa texto
 * plano sin comas (`datos.amount` en el estado del formulario sigue
 * siendo el string limpio que espera `z.coerce.number()`); esto solo
 * decide qué se le muestra a la persona mientras no tiene el foco. */
export function formatearMontoInput(valorCrudo: string): string {
  if (!valorCrudo) return "";
  const [entero, decimal] = valorCrudo.split(".");
  const enteroFormateado = entero === "" ? "" : Number(entero).toLocaleString("es-MX");
  return decimal === undefined ? enteroFormateado : `${enteroFormateado}.${decimal}`;
}

/** Piezas disponibles = stock físico − piezas apartadas (modelo-datos.md §1). */
export function stockDisponible(stock: number, reserved: number): number {
  return Math.max(0, stock - reserved);
}

/** Piezas disponibles que activan el refuerzo "¡Quedan X!" (P8,
 * diseño-pagos-stripe.md §7). Mismo umbral "bajo" que ya usa el resto del
 * sitio (`REGLAS_STOCK_BAJO`, l. 2032 del demo, y el widget "Se te va a
 * acabar" del tablero admin: `disponible <= 3`), acotado a 1–2 porque 3
 * sigue diciendo "Últimas 3 piezas" sin cambio (§7, tabla). */
const REGLAS_STOCK_URGENTE = 2;

/** index.html:2037 — reglas de etiqueta de stock (hallazgo #18 de modelo-datos.md).
 * P8 (diseño-pagos-stripe.md §7): refuerza el texto a "¡Queda 1!" / "¡Quedan 2!"
 * cuando el disponible es 1 o 2; 3 piezas conserva "Últimas 3 piezas". */
export function etiquetaStock(disponible: number): string {
  if (disponible === 0) return "Agotado";
  if (disponible <= REGLAS_STOCK_URGENTE) {
    return disponible === 1 ? "¡Queda 1!" : `¡Quedan ${disponible}!`;
  }
  if (disponible <= REGLAS_STOCK_BAJO) return `Últimas ${disponible} piezas`;
  return `${disponible} disponibles`;
}

/** Texto de la etiqueta ámbar sobre la foto del producto (P8,
 * diseño-pagos-stripe.md §7, `AvisoQuedan`): solo existe para 1–2 piezas
 * disponibles; `null` en cualquier otro caso (incluye "sin dato de stock",
 * que el llamador debe tratar como "ocultar el aviso", §7). */
export function etiquetaAvisoQuedan(disponible: number): string | null {
  if (disponible <= 0 || disponible > REGLAS_STOCK_URGENTE) return null;
  return disponible === 1 ? "QUEDA 1" : `QUEDAN ${disponible}`;
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

/** `clabeGroups` (index.html:1140) — agrupa una cadena de dígitos de 4 en 4
 * separados por un espacio, para que se lean en voz alta o se copien más
 * fácil (CLABE, referencia OXXO). diseño-pagos-stripe.md §3/§4: "mismo
 * criterio que `clabeGroups`". El valor que de verdad se copia al
 * portapapeles nunca usa esta versión agrupada (siempre el original sin
 * espacios). */
export function agruparDigitos(valor: string, tamanoGrupo = 4): string {
  const limpio = valor.replace(/\s+/g, "");
  const grupos: string[] = [];
  for (let i = 0; i < limpio.length; i += tamanoGrupo) {
    grupos.push(limpio.slice(i, i + tamanoGrupo));
  }
  return grupos.join(" ");
}
