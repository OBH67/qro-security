"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  analizarCsvAction,
  iniciarImportacionAction,
  procesarLoteImportacionAction,
  detenerImportacionAction,
  obtenerImportacionEnCursoAction,
  type ResultadoAnalisisCsv,
  type ResumenImportJob,
} from "@/server/actions/admin/importador";
import { generarPlantillaCsvCatalogo } from "@/lib/plantillaCsvCatalogo";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import type { ModoImportacion } from "@/server/domain/csvImportador";

type FiltroFilas = "todas" | "error" | "correctas";
type Vista = "subir" | "revisar" | "aplicando";

/** panel-admin-maqueta.html:1019-1094 + diseño.md §11.8 — asistente de
 * tres pasos. El paso 3 ("Aplicar") corre por lotes de 200 filas
 * (arquitectura.md §9.5): el navegador llama un lote, espera la
 * respuesta, actualiza la barra y pide el siguiente — mientras la
 * pestaña siga abierta. Ver la nota de "simplificación real" en
 * `supabase/migrations/0024_import_jobs.sql` sobre por qué esto NO es un
 * trabajo en segundo plano de verdad (sin cron, sin aviso por correo al
 * terminar) aunque sí sobrevive a un refresh o a cerrarla a medias.
 */
export function ImportadorCatalogo() {
  const [vista, setVista] = useState<Vista>("subir");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [modo, setModo] = useState<ModoImportacion>("todo");
  const [resultado, setResultado] = useState<ResultadoAnalisisCsv | null>(null);
  const [filtro, setFiltro] = useState<FiltroFilas>("todas");
  const [error, setError] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [job, setJob] = useState<ResumenImportJob | null>(null);
  const [revisandoTrabajoEnCurso, setRevisandoTrabajoEnCurso] = useState(true);
  const detenerRef = useRef(false);

  // Al entrar, ¿había un trabajo a medias (se cerró la pestaña, se cortó
  // internet)? Diseño.md §11.8, estado "Interrumpido" — se salta directo
  // a la vista de progreso, sin repetir subir/revisar (esas filas ya
  // están guardadas en el trabajo, del lado del servidor).
  useEffect(() => {
    let cancelado = false;
    obtenerImportacionEnCursoAction().then((res) => {
      if (cancelado) return;
      if (res.ok && res.data) {
        setJob(res.data);
        setVista("aplicando");
      }
      setRevisandoTrabajoEnCurso(false);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  // Motor del paso 3: mientras haya un trabajo `procesando`, pide el
  // siguiente lote, espera, y repite — hasta que se complete, se detenga,
  // o el usuario le dé "Detener la importación" (detenerRef).
  useEffect(() => {
    if (vista !== "aplicando" || !job || job.status !== "procesando") return;
    let cancelado = false;
    (async () => {
      while (!cancelado && !detenerRef.current) {
        const res = await procesarLoteImportacionAction(job.id);
        if (cancelado) return;
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setJob(res.data);
        if (res.data.status !== "procesando") return;
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe arrancar una vez por job.id, no en cada cambio de `job`
  }, [vista, job?.id]);

  async function analizar() {
    if (!archivo) {
      setError("Elige un archivo para continuar.");
      return;
    }
    setError(null);
    setAnalizando(true);
    const formData = new FormData();
    formData.set("archivo", archivo);
    formData.set("modo", modo);
    const res = await analizarCsvAction(formData);
    setAnalizando(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResultado(res.data);
    setFiltro("todas");
    setVista("revisar");
  }

  async function aplicar() {
    if (!resultado) return;
    setError(null);
    setIniciando(true);
    const res = await iniciarImportacionAction(resultado.nombreArchivo, modo, resultado.filas);
    setIniciando(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    detenerRef.current = false;
    setJob(res.data);
    setVista("aplicando");
  }

  async function detener() {
    if (!job) return;
    detenerRef.current = true;
    const res = await detenerImportacionAction(job.id);
    if (res.ok) setJob(res.data);
  }

  function empezarDeNuevo() {
    detenerRef.current = true;
    setJob(null);
    setResultado(null);
    setArchivo(null);
    setError(null);
    setVista("subir");
  }

  function descargarPlantilla() {
    const blob = new Blob([generarPlantillaCsvCatalogo()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-catalogo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function descargarFilasConError() {
    if (!resultado) return;
    const conError = resultado.filas.filter((f) => !f.ok);
    descargarCsvDeFilas(conError.map((f) => [f.sku, f.nombre, f.precio, f.stock, f.motivo]), "sku,nombre,precio,stock,motivo", "filas-con-error.csv");
  }

  function descargarFilasQueFallaron() {
    if (!job) return;
    descargarCsvDeFilas(
      job.fallas.map((f) => [String(f.numeroFila), f.sku, f.nombre, f.motivo]),
      "fila,sku,nombre,motivo",
      "filas-que-fallaron.csv",
    );
  }

  if (revisandoTrabajoEnCurso) return null;

  if (vista === "aplicando" && job) {
    return <VistaAplicando job={job} onDetener={detener} onDescargarFallas={descargarFilasQueFallaron} onEmpezarDeNuevo={empezarDeNuevo} error={error} />;
  }

  if (vista === "subir" || !resultado) {
    return (
      <div style={{ maxWidth: 760 }}>
        <h1 className="title" style={{ fontSize: 28, margin: "0 0 6px" }}>
          Importar catálogo
        </h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: "var(--accent)", marginBottom: 24 }}>
          <span style={{ fontWeight: 600 }}>① Subir archivo</span>
          <span style={{ color: "var(--border-strong)" }}>────</span>
          <span style={{ color: "var(--text-dim)" }}>② Revisar</span>
          <span style={{ color: "var(--border-strong)" }}>────</span>
          <span style={{ color: "var(--text-dim)" }}>③ Aplicar</span>
        </div>

        <div style={{ border: "1px dashed var(--border-input)", padding: "48px 24px", textAlign: "center", marginBottom: 16 }}>
          {archivo ? (
            <>
              <div className="mono" style={{ fontSize: 14, color: "var(--text-primary)", marginBottom: 10 }}>
                {archivo.name}
              </div>
              <button className="btn btn-fantasma btn-sm" onClick={() => setArchivo(null)}>
                Cambiar archivo
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, marginBottom: 10 }}>Arrastra aquí tu archivo CSV o elige uno</div>
              <label className="btn btn-secundario cut cut-10" style={{ cursor: "pointer" }}>
                Elige un archivo
                <input type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
              </label>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>Hasta 10 MB · formato .csv</div>
            </>
          )}
        </div>

        <div style={{ background: "var(--accent-tint)", border: "1px solid var(--border)", padding: "12px 14px", fontSize: 13, marginBottom: 16 }}>
          ⓘ ¿Primera vez?{" "}
          <button onClick={descargarPlantilla} style={{ color: "var(--accent)" }}>
            Descarga la plantilla
          </button>{" "}
          con las columnas correctas y un ejemplo lleno. Los productos se identifican por su SKU: si ya existe, se actualiza; si no, se crea.
        </div>

        <div style={{ fontSize: 14, marginBottom: 8 }}>Qué quieres actualizar:</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, color: "var(--text-secondary)", marginBottom: 22 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="radio" name="modo" checked={modo === "todo"} onChange={() => setModo("todo")} /> Todo el producto (crea nuevos y actualiza existentes)
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="radio" name="modo" checked={modo === "solo_precios"} onChange={() => setModo("solo_precios")} /> Solo precios
          </label>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="radio" name="modo" checked={modo === "solo_stock"} onChange={() => setModo("solo_stock")} /> Solo existencias
          </label>
        </div>

        {error && <p style={{ fontSize: 14, color: "var(--danger-text)", marginBottom: 16 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Link href="/admin/catalogo" className="btn btn-fantasma cut cut-10">
            Cancelar
          </Link>
          <BotonAdmin className="cut cut-12" onClick={analizar} disabled={!archivo} cargando={analizando} textoCargando="Revisando…">
            Revisar archivo
          </BotonAdmin>
        </div>
      </div>
    );
  }

  const filasFiltradas = resultado.filas.filter((f) => (filtro === "todas" ? true : filtro === "error" ? !f.ok : f.ok));

  return (
    <div>
      <h1 className="title" style={{ fontSize: 28, margin: "0 0 6px" }}>
        Importar catálogo · Revisar
      </h1>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, marginBottom: 8 }}>
        <span style={{ color: "var(--success)" }}>✓ Subir archivo</span>
        <span style={{ color: "var(--border-strong)" }}>────</span>
        <span style={{ color: "var(--accent)", fontWeight: 600 }}>② Revisar</span>
        <span style={{ color: "var(--border-strong)" }}>────</span>
        <span style={{ color: "var(--text-dim)" }}>③ Aplicar</span>
      </div>
      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
        {resultado.nombreArchivo} · {resultado.totalFilas} filas
      </div>

      <div className="admin-grid-3" style={{ gap: 14, marginBottom: 20 }}>
        <div className="tarjeta cut cut-12" style={{ padding: 18, textAlign: "center", borderColor: "var(--success)" }}>
          <div className="mono" style={{ fontSize: 36, color: "var(--success)", fontWeight: 500 }}>
            {resultado.correctas}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-title)", fontWeight: 600, letterSpacing: 0.5 }}>CORRECTAS ✓</div>
        </div>
        <div className="tarjeta cut cut-12" style={{ padding: 18, textAlign: "center", borderColor: "var(--danger)" }}>
          <div className="mono" style={{ fontSize: 36, color: "var(--danger-text)", fontWeight: 500 }}>
            {resultado.conError}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-title)", fontWeight: 600, letterSpacing: 0.5 }}>CON ERROR ✕</div>
        </div>
        <div className="tarjeta cut cut-12" style={{ padding: 18, textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 22, fontWeight: 500 }}>
            {resultado.nuevos} / {resultado.actualizar}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-title)", fontWeight: 600, letterSpacing: 0.5 }}>NUEVOS / ACTUALIZAR</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button className={`chip${filtro === "error" ? " activo" : ""}`} onClick={() => setFiltro("error")}>
          Solo con error ({resultado.conError})
        </button>
        <button className={`chip${filtro === "correctas" ? " activo" : ""}`} onClick={() => setFiltro("correctas")}>
          Solo correctas ({resultado.correctas})
        </button>
        <button className={`chip${filtro === "todas" ? " activo" : ""}`} onClick={() => setFiltro("todas")}>
          Todas
        </button>
      </div>

      <div className="tarjeta">
        <table>
          <thead>
            <tr>
              <th>Fila</th>
              <th>SKU</th>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Qué pasa</th>
            </tr>
          </thead>
          <tbody>
            {filasFiltradas.map((f) => (
              <tr key={f.numeroFila}>
                <td className="mono" style={{ color: f.ok ? "var(--success)" : "var(--danger-text)" }}>
                  {f.ok ? "✓" : "✕"} {f.numeroFila}
                </td>
                <td className="mono">{f.sku || "(vacío)"}</td>
                <td>{f.nombre}</td>
                <td className="mono">{f.precio}</td>
                <td className="mono">{f.stock}</td>
                <td style={{ color: f.ok ? "var(--success)" : "var(--danger-text)", fontSize: 13 }}>
                  {f.motivo}
                  {f.ofrecerCrearSubcategoria && (
                    <Link href="/admin/catalogo/categorias" style={{ marginLeft: 6 }}>
                      [Crearla]
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {filasFiltradas.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 24 }}>
                  Sin filas en este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 13, color: "var(--text-muted)", margin: "14px 0" }}>
        ⓘ Las {resultado.conError} filas con error se omitirían; las {resultado.correctas} correctas sí se aplicarían.
      </div>

      {error && <p style={{ fontSize: 14, color: "var(--danger-text)", margin: "0 0 14px" }}>{error}</p>}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-fantasma cut cut-10" onClick={() => setVista("subir")}>
            ‹ Cambiar archivo
          </button>
          {resultado.conError > 0 && (
            <button className="btn btn-fantasma cut cut-10" onClick={descargarFilasConError}>
              Descargar las {resultado.conError} filas con error
            </button>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <BotonAdmin
            className="cut cut-12"
            onClick={aplicar}
            disabled={resultado.correctas === 0}
            cargando={iniciando}
            textoCargando="Iniciando…"
            title={resultado.correctas === 0 ? "Ninguna fila se puede aplicar todavía. Corrige los errores y vuelve a subir el archivo." : undefined}
          >
            Aplicar {resultado.correctas} productos
          </BotonAdmin>
        </div>
      </div>
    </div>
  );
}

function descargarCsvDeFilas(filas: string[][], encabezado: string, nombreArchivo: string) {
  const lineas = filas.map((cols) => cols.map((v) => `"${(v ?? "").replace(/"/g, '""')}"`).join(","));
  const blob = new Blob([[encabezado, ...lineas].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

/** Paso 3 — diseño.md §11.8. Cubre los cuatro estados: en curso, completo,
 * con fallas parciales, y detenido. */
function VistaAplicando({
  job,
  onDetener,
  onDescargarFallas,
  onEmpezarDeNuevo,
  error,
}: {
  job: ResumenImportJob;
  onDetener: () => void;
  onDescargarFallas: () => void;
  onEmpezarDeNuevo: () => void;
  error: string | null;
}) {
  const porcentaje = job.total > 0 ? Math.round((job.siguiente_indice / job.total) * 100) : 100;
  const loteActual = Math.ceil(job.siguiente_indice / 200);
  const totalLotes = Math.max(1, Math.ceil(job.total / 200));

  return (
    <div style={{ maxWidth: 620 }}>
      <h1 className="title" style={{ fontSize: 28, margin: "0 0 6px" }}>
        Importar catálogo · Aplicar
      </h1>
      <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 24 }}>
        {job.nombre_archivo}
      </div>

      {error && <p style={{ fontSize: 14, color: "var(--danger-text)", marginBottom: 16 }}>{error}</p>}

      {job.status === "procesando" && (
        <div className="tarjeta" style={{ padding: 22 }}>
          <div style={{ height: 10, background: "var(--track)", overflow: "hidden", marginBottom: 12 }}>
            <div style={{ height: "100%", width: `${porcentaje}%`, background: "var(--accent)", transition: "width 300ms ease" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
            <span>
              {job.siguiente_indice} de {job.total} productos aplicados
            </span>
            <span className="mono">{porcentaje}%</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 18 }}>
            Lote {loteActual} de {totalLotes}
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-muted)", marginBottom: 18 }}>ⓘ No cierres esta pestaña — el avance depende de que siga abierta.</div>
          <button className="btn btn-peligro cut cut-10" onClick={onDetener}>
            Detener la importación
          </button>
        </div>
      )}

      {job.status === "completado" && job.fallidos === 0 && (
        <div className="tarjeta" style={{ padding: 22, borderColor: "var(--success)" }}>
          <div style={{ fontSize: 16, color: "var(--success)", marginBottom: 8 }}>✓ {job.aplicados} productos aplicados</div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20 }}>
            {job.nuevos} nuevos · {job.actualizados} actualizados
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/admin/catalogo" className="btn btn-primario cut cut-10">
              Ver el catálogo
            </Link>
            <button className="btn btn-fantasma cut cut-10" onClick={onEmpezarDeNuevo}>
              Importar otro archivo
            </button>
          </div>
        </div>
      )}

      {job.status === "completado" && job.fallidos > 0 && (
        <div className="tarjeta" style={{ padding: 22, borderColor: "var(--warning)" }}>
          <div style={{ fontSize: 16, color: "var(--warning)", marginBottom: 12 }}>
            ⚠ {job.aplicados} aplicados · {job.fallidos} fallaron al guardar
          </div>
          <div className="tarjeta" style={{ marginBottom: 16, maxHeight: 260, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>SKU</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {job.fallas.map((f) => (
                  <tr key={f.numeroFila}>
                    <td className="mono">{f.numeroFila}</td>
                    <td className="mono">{f.sku}</td>
                    <td style={{ fontSize: 13, color: "var(--danger-text)" }}>{f.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/admin/catalogo" className="btn btn-primario cut cut-10">
              Ver el catálogo
            </Link>
            <button className="btn btn-fantasma cut cut-10" onClick={onDescargarFallas}>
              Descargar las {job.fallidos} filas que fallaron
            </button>
            <button className="btn btn-fantasma cut cut-10" onClick={onEmpezarDeNuevo}>
              Importar otro archivo
            </button>
          </div>
        </div>
      )}

      {job.status === "detenido" && (
        <div className="tarjeta" style={{ padding: 22 }}>
          <div style={{ fontSize: 16, marginBottom: 8 }}>Importación detenida</div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 20 }}>
            Los {job.aplicados} productos que ya se aplicaron se conservan; los {job.total - job.siguiente_indice} restantes no se cargaron.
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/admin/catalogo" className="btn btn-primario cut cut-10">
              Ver el catálogo
            </Link>
            <button className="btn btn-fantasma cut cut-10" onClick={onEmpezarDeNuevo}>
              Importar otro archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
