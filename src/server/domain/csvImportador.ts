/**
 * F2 — parser de CSV puro (arquitectura.md §4, regla de dependencia #2:
 * sin React/Next/Supabase, para poder probarse sin infraestructura — y
 * sin dependencia externa: el paquete `xlsx` más usado en npm tiene una
 * vulnerabilidad de prototype pollution/ReDoS sin parche disponible en
 * el registro — no se instaló. Por eso este incremento soporta CSV, no
 * todavía `.xlsx`; documentado como límite real, no una omisión
 * silenciosa). Sigue RFC 4180 en lo esencial: campos entre comillas,
 * comillas escapadas como `""`, comas y saltos de línea dentro de un
 * campo entre comillas.
 */
export function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let dentroDeComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    const siguiente = texto[i + 1];

    if (dentroDeComillas) {
      if (c === '"' && siguiente === '"') {
        campo += '"';
        i++;
      } else if (c === '"') {
        dentroDeComillas = false;
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      dentroDeComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && siguiente === "\n") i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas.filter((f) => f.some((c) => c.trim() !== ""));
}

export type ModoImportacion = "todo" | "solo_precios" | "solo_stock";

export interface FilaCsvCruda {
  numeroFila: number; // 1-based, contando el encabezado como fila 1
  valores: Record<string, string>;
}

export function filasCrudasDesdeTexto(texto: string): { filas: FilaCsvCruda[]; columnasFaltantes: string[] } | { error: string } {
  const tabla = parsearCsv(texto);
  if (tabla.length === 0) return { error: "El archivo está vacío." };

  const encabezado = tabla[0].map((c) => c.trim().toLowerCase());
  const columnasObligatorias = ["sku", "nombre"];
  const columnasFaltantes = columnasObligatorias.filter((c) => !encabezado.includes(c));
  if (columnasFaltantes.length > 0) {
    return { error: `No encontramos las columnas ${columnasFaltantes.map((c) => `«${c}»`).join(" y ")} en tu archivo.` };
  }

  const filas: FilaCsvCruda[] = tabla.slice(1).map((valores, i) => {
    const registro: Record<string, string> = {};
    encabezado.forEach((col, j) => {
      registro[col] = (valores[j] ?? "").trim();
    });
    return { numeroFila: i + 2, valores: registro };
  });

  return { filas, columnasFaltantes: [] };
}
