"use server";

import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import { filasCrudasDesdeTexto, type ModoImportacion } from "@/server/domain/csvImportador";
import { validarFilaImportacion, type FilaValidada } from "@/server/domain/validacionImportacion";
import { obtenerCatalogoParaValidarImportacion } from "@/server/db/queries/admin/importador";

const ROLES_CATALOGO = ["admin", "inventario"] as const;
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // F2.1: hasta 10 MB

export interface ResultadoAnalisisCsv {
  nombreArchivo: string;
  totalFilas: number;
  correctas: number;
  conError: number;
  nuevos: number;
  actualizar: number;
  filas: FilaValidada[];
}

/** F2.1/F2.2: paso 1→2 del importador — analiza el archivo sin escribir
 * nada en la base (el paso 3, "Aplicar", no es parte de este incremento;
 * ver `.devsquad/estado.md`). Solo CSV por ahora: `.xlsx` requeriría una
 * dependencia (`xlsx`/SheetJS) con una vulnerabilidad conocida sin parche
 * en el registro de npm — no se instaló, documentado como límite real. */
export async function analizarCsvAction(formData: FormData): Promise<ResultadoAction<ResultadoAnalisisCsv>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const archivo = formData.get("archivo");
    const modo = formData.get("modo") as ModoImportacion | null;

    if (!(archivo instanceof File)) throw new Error("Elige un archivo para continuar.");
    if (!modo || !["todo", "solo_precios", "solo_stock"].includes(modo)) throw new Error("Elige qué quieres actualizar.");
    if (archivo.size > TAMANO_MAXIMO_BYTES) throw new Error(`El archivo pesa más de 10 MB. Divídelo en dos.`);
    if (!archivo.name.toLowerCase().endsWith(".csv")) {
      throw new Error(archivo.name.toLowerCase().endsWith(".xlsx") ? "Por ahora solo aceptamos CSV — exporta tu Excel como CSV e inténtalo de nuevo." : "Ese archivo no es un CSV.");
    }

    const texto = await archivo.text();
    const resultado = filasCrudasDesdeTexto(texto);
    if ("error" in resultado) throw new Error(resultado.error);

    const catalogo = await obtenerCatalogoParaValidarImportacion();
    const filas = resultado.filas.map((f) => validarFilaImportacion(f, modo, catalogo));

    return {
      nombreArchivo: archivo.name,
      totalFilas: filas.length,
      correctas: filas.filter((f) => f.ok).length,
      conError: filas.filter((f) => !f.ok).length,
      nuevos: filas.filter((f) => f.ok && f.esNueva).length,
      actualizar: filas.filter((f) => f.ok && !f.esNueva).length,
      filas,
    };
  });
}
