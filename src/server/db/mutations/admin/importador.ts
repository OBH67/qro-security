import "server-only";
import { crearClienteAdmin } from "@/server/supabase/admin";
import { crearProductoAdmin, actualizarProductoAdmin, type DatosProducto } from "./catalogo";
import { obtenerCatalogoParaAplicarImportacion, type CatalogoParaAplicar } from "@/server/db/queries/admin/importador";
import type { FilaValidada } from "@/server/domain/validacionImportacion";
import type { ModoImportacion } from "@/server/domain/csvImportador";

const TAMANO_LOTE = 200; // arquitectura.md §9.5

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
  total: number;
  nuevos: number;
  actualizados: number;
  siguiente_indice: number;
  aplicados: number;
  fallidos: number;
  fallas: FallaAplicacion[];
  created_at: string;
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
      nombre_archivo: params.nombreArchivo,
      modo: params.modo,
      filas: filasOk,
      total: filasOk.length,
      nuevos: filasOk.filter((f) => f.esNueva).length,
      actualizados: filasOk.filter((f) => !f.esNueva).length,
    })
    .select()
    .single();
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ImportJobRow;
}

/** El trabajo `procesando` más reciente de esta persona, para el aviso de
 * "tu importación se quedó en el X%" al volver a entrar al importador
 * (diseño.md §11.8, estado "Interrumpido"). */
export async function obtenerImportJobEnCurso(createdBy: string): Promise<ImportJobRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin
    .from("import_jobs")
    .select()
    .eq("created_by", createdBy)
    .eq("status", "procesando")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ImportJobRow | null;
}

export async function obtenerImportJob(id: string): Promise<ImportJobRow | null> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.from("import_jobs").select().eq("id", id).maybeSingle();
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ImportJobRow | null;
}

export async function detenerImportJob(id: string): Promise<ImportJobRow> {
  const admin = crearClienteAdmin();
  const { data, error } = await admin.from("import_jobs").update({ status: "detenido", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "procesando").select().single();
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ImportJobRow;
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
 * detiene a las demás (F2.4) — se cuenta en `fallidos`/`fallas` y sigue
 * con la siguiente. Idempotente si se llama dos veces sobre un trabajo ya
 * `completado`/`detenido`: regresa el trabajo tal cual, sin reprocesar. */
export async function aplicarLoteImportJob(jobId: string, changedBy: string): Promise<ImportJobRow> {
  const admin = crearClienteAdmin();
  const job = await obtenerImportJob(jobId);
  if (!job) throw new Error("El trabajo de importación no existe.");
  if (job.status !== "procesando") return job;

  const filas = job.filas as unknown as FilaValidada[];
  const lote = filas.slice(job.siguiente_indice, job.siguiente_indice + TAMANO_LOTE);
  const catalogo = await obtenerCatalogoParaAplicarImportacion();

  let aplicados = 0;
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
      aplicados++;
    } catch (error) {
      fallasNuevas.push({ numeroFila: fila.numeroFila, sku: fila.sku, nombre: fila.nombre, motivo: error instanceof Error ? error.message : "Error desconocido al guardar." });
    }
  }

  const siguienteIndice = job.siguiente_indice + lote.length;
  const completado = siguienteIndice >= job.total;

  const { data, error } = await admin
    .from("import_jobs")
    .update({
      siguiente_indice: siguienteIndice,
      aplicados: job.aplicados + aplicados,
      fallidos: job.fallidos + fallasNuevas.length,
      fallas: [...job.fallas, ...fallasNuevas],
      status: completado ? "completado" : "procesando",
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId)
    .select()
    .single();
  if (error) throw new Error(traducirError(error.message));
  return data as unknown as ImportJobRow;
}
