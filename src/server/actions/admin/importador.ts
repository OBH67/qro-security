"use server";

import { revalidatePath } from "next/cache";
import { conSesionStaff, type ResultadoAction } from "@/server/actions/admin/_guard";
import { filasCrudasDesdeTexto, type ModoImportacion } from "@/server/domain/csvImportador";
import { validarFilaImportacion, type FilaValidada } from "@/server/domain/validacionImportacion";
import { obtenerCatalogoParaValidarImportacion } from "@/server/db/queries/admin/importador";
import {
  crearImportJob,
  aplicarLoteImportJob,
  detenerImportJob,
  obtenerImportJob,
  obtenerImportJobEnCurso,
  type ImportJobRow,
} from "@/server/db/mutations/admin/importador";

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
 * nada en la base; el paso 3 ("Aplicar") es `iniciarImportacionAction` +
 * `procesarLoteImportacionAction`, abajo. Solo CSV por ahora: `.xlsx`
 * requeriría una dependencia (`xlsx`/SheetJS) con una vulnerabilidad
 * conocida sin parche en el registro de npm — no se instaló, documentado
 * como límite real. */
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

function revalidarCatalogo() {
  revalidatePath("/admin/catalogo");
}

/** El cliente nunca necesita de vuelta las filas completas del trabajo
 * (ya las tiene, se las mandó él) — se recortan de cada respuesta para no
 * ir y venir con ~1,000 filas en cada vuelta del ciclo de "siguiente lote". */
export type ResumenImportJob = Omit<ImportJobRow, "filas">;
function resumir(job: ImportJobRow): ResumenImportJob {
  const { filas: _filas, ...resto } = job;
  return resto;
}

/** F2.3, paso 3 — arranca el trabajo con las filas que ya pasaron el paso
 * 2 (`ok: true`; las demás se descartan aquí, nunca se aplican). No
 * aplica nada todavía — eso lo dispara el primer
 * `procesarLoteImportacionAction`, para que la barra de progreso arranque
 * en 0% (diseño.md §11.8). */
export async function iniciarImportacionAction(nombreArchivo: string, modo: ModoImportacion, filas: FilaValidada[]): Promise<ResultadoAction<ResumenImportJob>> {
  return conSesionStaff([...ROLES_CATALOGO], async (sesion) => {
    if (!filas.some((f) => f.ok)) throw new Error("Ninguna fila se puede aplicar todavía. Corrige los errores y vuelve a subir el archivo.");
    return resumir(await crearImportJob({ createdBy: sesion.userId, nombreArchivo, modo, filas }));
  });
}

/** Aplica el siguiente lote de hasta 200 filas (arquitectura.md §9.5). El
 * cliente llama esta acción en un ciclo mientras el trabajo siga
 * `procesando`, actualizando la barra de progreso en cada vuelta —
 * ver la nota de "simplificación real" en la migración `0024_import_
 * jobs.sql` sobre por qué el avance depende de la pestaña abierta. */
export async function procesarLoteImportacionAction(jobId: string): Promise<ResultadoAction<ResumenImportJob>> {
  return conSesionStaff([...ROLES_CATALOGO], async (sesion) => {
    const job = await aplicarLoteImportJob(jobId, sesion.userId);
    if (job.status === "completado") revalidarCatalogo();
    return resumir(job);
  });
}

export async function detenerImportacionAction(jobId: string): Promise<ResultadoAction<ResumenImportJob>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const job = await detenerImportJob(jobId);
    revalidarCatalogo();
    return resumir(job);
  });
}

export async function obtenerImportJobAction(jobId: string): Promise<ResultadoAction<ResumenImportJob | null>> {
  return conSesionStaff([...ROLES_CATALOGO], async () => {
    const job = await obtenerImportJob(jobId);
    return job ? resumir(job) : null;
  });
}

/** Para el aviso de "tu importación se quedó en el X%" al entrar al
 * importador (diseño.md §11.8, estado "Interrumpido"). */
export async function obtenerImportacionEnCursoAction(): Promise<ResultadoAction<ResumenImportJob | null>> {
  return conSesionStaff([...ROLES_CATALOGO], async (sesion) => {
    const job = await obtenerImportJobEnCurso(sesion.userId);
    return job ? resumir(job) : null;
  });
}
