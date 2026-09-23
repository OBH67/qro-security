import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { crearProductoAdmin, actualizarProductoAdmin, type DatosProducto } from "./catalogo";
import { obtenerCatalogoParaAplicarImportacion, type CatalogoParaAplicar } from "@/server/db/queries/admin/importador";
import type { FilaValidada } from "@/server/domain/validacionImportacion";
import type { ModoImportacion } from "@/server/domain/csvImportador";

const TAMANO_LOTE = 200; // arquitectura.md §9.5

// La tabla `import_jobs` (0003_catalogo.sql, completada en
// 0024_import_jobs.sql) usa su propio vocabulario en `mode`/`status` —
// se traduce aquí, en la frontera con la base, para que el resto del
// código siga hablando en los términos de `ModoImportacion` (csvImportador.ts)
// y de los nombres que ya usan las Server Actions y la UI del paso 3.
type ModoDb = "crear_actualizar" | "solo_precio" | "solo_stock";
type StatusDb = "analizando" | "listo_para_aplicar" | "aplicando" | "completado" | "error" | "detenido";

const MODO_A_DB: Record<ModoImportacion, ModoDb> = { todo: "crear_actualizar", solo_precios: "solo_precio", solo_stock: "solo_stock" };
const MODO_DESDE_DB: Record<ModoDb, ModoImportacion> = { crear_actualizar: "todo", solo_precio: "solo_precios", solo_stock: "solo_stock" };

export interface FallaAplicacion {
  numeroFila: number;
  sku: string;
  nombre: string;
  motivo: string;
}

export interface ImportJobRow {
  id: string;
  nombre_archivo: string;
  modo: ModoImportacion;
  status: "procesando" | "completado" | "detenido";
  filas: FilaValidada[];
  total: number; // = valid_rows: cuántas filas se van a procesar (las que pasaron el paso 2)
  nuevos: number;
  actualizados: number;
  siguiente_indice: number; // = processed_rows
  aplicados: number; // derivado: processed_rows - fallas.length
  fallidos: number; // derivado: fallas.length
  fallas: FallaAplicacion[]; // = errors_report (fallas al APLICAR, distinto de error_rows del paso 2)
  created_at: string;
}

interface ImportJobFila {
  id: string;
  file_url: string;
  mode: ModoDb;
  status: StatusDb;
  valid_rows: number;
  processed_rows: number;
  errors_report: FallaAplicacion[] | null;
  filas: FilaValidada[];
  nuevos: number;
  actualizados: number;
  created_at: string;
}

// `detenido` no forma parte del vocabulario original de status (0003) —
// se sumó al check de la tabla en 0024_import_jobs.sql.
function statusDesdeDb(status: StatusDb): ImportJobRow["status"] {
  if (status === "completado") return "completado";
  if (status === "detenido") return "detenido";
  return "procesando"; // analizando | listo_para_aplicar | aplicando | error
}

function filaARow(f: ImportJobFila): ImportJobRow {
  const fallas = f.errors_report ?? [];
  return {
    id: f.id,
    nombre_archivo: f.file_url,
    modo: MODO_DESDE_DB[f.mode],
    status: statusDesdeDb(f.status),
    filas: f.filas,
    total: f.valid_rows,
    nuevos: f.nuevos,
    actualizados: f.actualizados,
    siguiente_indice: f.processed_rows,
    aplicados: f.processed_rows - fallas.length,
    fallidos: fallas.length,
    fallas,
    created_at: f.created_at,
  };
}

function traducirError(mensaje: string): string {
  return mensaje.replace(/^ERROR:\s*/i, "").trim();
}

/** Arranca el paso 3 — guarda solo las filas que ya pasaron la validación
 * del paso 2 (las que tenían error nunca llegan aquí, se descartaron
 * desde la vista previa). No aplica nada todavía: el primer lote lo pide
 * el cliente aparte, para que la barra de progreso arranque en 0%, igual
 * que diseño.md §11.8 la dibuja. */
export async function crearImportJob(params: { createdBy: string; nombreArchivo: string; modo: ModoImportacion; filas: FilaValidada[] }): Promise<ImportJobRow> {
  const admin = crearClienteAdmin();
  const filasOk = params.filas.filter((f) => f.ok);
  const { data, error } = await admin
    .from("import_jobs")
    .insert({
      created_by: params.createdBy,
      file_url: params.nombreArchivo,
      mode: MODO_A_DB[params.modo],
      status: "aplicando",
      total_rows: params.filas.length,
      valid_rows: filasOk.length,
      error_rows: params.filas.length - filasOk.length, // filas rechazadas en el paso 2 — no se toca después
      processed_rows: 0,
      errors_report: [],
      filas: filasOk,
      nuevos: filasOk.filter((f) => f.esNueva).length,
      actualizados: filasOk.filter((f) => !f.esNueva).length,
    })
    .select()
    .single();
  if (error) throw new Error(traducirError(error.message));
  return filaARow(data as unknown as ImportJobFila);
}

/** El trabajo `procesando` (`aplicando`, en la base) más reciente de esta
 * persona, para el aviso de "tu importación se quedó en el X%" al volver
 * a entrar al importador (diseño.md §11.8, estado "Interrumpido"). */
export async function obtenerImportJobEnCurso(createdBy: string): Promise<ImportJobRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from("import_jobs")
    .select()
    .eq("created_by", createdBy)
    .eq("status", "aplicando")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(traducirError(error.message));
  return data ? filaARow(data as unknown as ImportJobFila) : null;
}

export async function obtenerImportJob(id: string): Promise<ImportJobRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.from("import_jobs").select().eq("id", id).maybeSingle();
  if (error) throw new Error(traducirError(error.message));
  return data ? filaARow(data as unknown as ImportJobFila) : null;
}

export async function detenerImportJob(id: string): Promise<ImportJobRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from("import_jobs")
    .update({ status: "detenido", finished_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "aplicando")
    .select()
    .single();
  if (error) throw new Error(traducirError(error.message));
  return filaARow(data as unknown as ImportJobFila);
}

function aNumero(texto: string): number | undefined {
  const limpio = texto.trim();
  return limpio ? Number(limpio) : undefined;
}

/** Resuelve marca/grupo/subcategoría/estado/precio/stock de texto a los
 * tipos que espera `DatosProducto`, comunes a crear y actualizar. */
function camposComunes(fila: FilaValidada, modo: ModoImportacion, catalogo: CatalogoParaAplicar) {
  const requierePrecio = modo === "todo" || modo === "solo_precios";
  const requiereStock = modo === "todo" || modo === "solo_stock";
  const marcaId = catalogo.marcasPorNombre.get((fila.datos.marca ?? "").trim().toLowerCase());
  const estadoCrudo = (fila.datos.estado ?? "").trim().toLowerCase();
  const estado = estadoCrudo && ["activo", "agotado", "descontinuado"].includes(estadoCrudo) ? (estadoCrudo as "activo" | "agotado" | "descontinuado") : undefined;
  const grupoNombre = (fila.datos.grupo ?? "").trim().toLowerCase();
  const subNombre = (fila.datos.subcategoria ?? "").trim().toLowerCase();
  const grupoId = grupoNombre ? catalogo.gruposPorNombre.get(grupoNombre) : undefined;
  const sub = subNombre ? catalogo.subcategoriasPorNombre.get(subNombre) : undefined;
  const grupoSubValidos = Boolean(grupoId && sub && sub.groupId === grupoId);
  return {
    marcaId,
    estado,
    precio: requierePrecio ? aNumero(fila.precio) : undefined,
    stock: requiereStock ? aNumero(fila.stock) : undefined,
    grupoId: grupoSubValidos ? grupoId : undefined,
    subcategoriaId: grupoSubValidos ? sub!.id : undefined,
  };
}

/** Producto NUEVO: grupo/subcategoría sin match es un error real — F2.2
 * ya lo garantizaba en el paso 2, pero el catálogo pudo cambiar entre el
 * paso 2 y este lote (alguien borró la subcategoría mientras tanto). */
function construirDatosProductoNuevo(fila: FilaValidada, modo: ModoImportacion, catalogo: CatalogoParaAplicar): DatosProducto | { error: string } {
  const c = camposComunes(fila, modo, catalogo);
  if (!c.grupoId || !c.subcategoriaId) {
    return { error: `El grupo "${fila.datos.grupo}" o la subcategoría "${fila.datos.subcategoria}" ya no existen — revisa las categorías y vuelve a intentar esta fila.` };
  }
  if (c.precio === undefined) return { error: "Falta el precio." };
  return {
    sku: fila.sku,
    name: fila.nombre,
    brandId: c.marcaId ?? null,
    groupId: c.grupoId,
    subcategoryId: c.subcategoriaId,
    price: c.precio,
    stock: c.stock ?? 0,
    status: c.estado,
    condition: "nuevo",
  };
}

/** Producto EXISTENTE: cada campo se manda solo si vino en el CSV y se
 * resolvió — F2.2 nunca exigió grupo/marca/subcategoría como obligatorios
 * para actualizar, así que uno que ya no resuelve simplemente no se toca
 * (el producto conserva su categoría/marca actual). */
function construirDatosProductoActualizado(fila: FilaValidada, modo: ModoImportacion, catalogo: CatalogoParaAplicar): Partial<DatosProducto> {
  const c = camposComunes(fila, modo, catalogo);
  return {
    name: fila.nombre.trim() || undefined,
    brandId: c.marcaId,
    groupId: c.grupoId,
    subcategoryId: c.subcategoriaId,
    price: c.precio,
    stock: c.stock,
    status: c.estado,
  };
}

/** Aplica el siguiente lote (hasta `TAMANO_LOTE` filas) de un trabajo. Una
 * fila que falla al guardar (p. ej. una categoría que ya no existe) no
 * detiene a las demás (F2.4) — se cuenta en `errors_report` y sigue con
 * la siguiente. Idempotente si se llama dos veces sobre un trabajo ya
 * `completado`/`detenido`: regresa el trabajo tal cual, sin reprocesar. */
export async function aplicarLoteImportJob(jobId: string, changedBy: string): Promise<ImportJobRow> {
  const admin = crearClienteAdmin();
  const job = await obtenerImportJob(jobId);
  if (!job) throw new Error("El trabajo de importación no existe.");
  if (job.status !== "procesando") return job;

  const lote = job.filas.slice(job.siguiente_indice, job.siguiente_indice + TAMANO_LOTE);
  const catalogo = await obtenerCatalogoParaAplicarImportacion();

  const fallasNuevas: FallaAplicacion[] = [];

  for (const fila of lote) {
    try {
      if (fila.esNueva) {
        const datos = construirDatosProductoNuevo(fila, job.modo, catalogo);
        if ("error" in datos) {
          fallasNuevas.push({ numeroFila: fila.numeroFila, sku: fila.sku, nombre: fila.nombre, motivo: datos.error });
          continue;
        }
        await crearProductoAdmin(datos);
      } else {
        const productId = catalogo.productoIdPorSku.get(fila.sku);
        if (!productId) {
          fallasNuevas.push({ numeroFila: fila.numeroFila, sku: fila.sku, nombre: fila.nombre, motivo: `El producto con SKU "${fila.sku}" ya no existe.` });
          continue;
        }
        const datos = construirDatosProductoActualizado(fila, job.modo, catalogo);
        await actualizarProductoAdmin(productId, changedBy, datos);
      }
    } catch (error) {
      fallasNuevas.push({ numeroFila: fila.numeroFila, sku: fila.sku, nombre: fila.nombre, motivo: error instanceof Error ? error.message : "Error desconocido al guardar." });
    }
  }

  const processedRows = job.siguiente_indice + lote.length;
  const completado = processedRows >= job.total;
  const errorsReport = [...job.fallas, ...fallasNuevas];

  const { data, error } = await admin
    .from("import_jobs")
    .update({
      processed_rows: processedRows,
      errors_report: errorsReport,
      status: completado ? "completado" : "aplicando",
      finished_at: completado ? new Date().toISOString() : null,
    })
    .eq("id", jobId)
    .select()
    .single();
  if (error) throw new Error(traducirError(error.message));
  return filaARow(data as unknown as ImportJobFila);
}
