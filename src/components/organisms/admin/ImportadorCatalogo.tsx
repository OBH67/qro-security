"use client";

import { useState } from "react";
import Link from "next/link";
import { analizarCsvAction } from "@/server/actions/admin/importador";
import { generarPlantillaCsvCatalogo } from "@/lib/plantillaCsvCatalogo";
import type { ResultadoAnalisisCsv } from "@/server/actions/admin/importador";
import type { ModoImportacion } from "@/server/domain/csvImportador";

type FiltroFilas = "todas" | "error" | "correctas";

/** panel-admin-maqueta.html:1019-1094 (`isImportPaso1`/`isImportPaso2`) —
 * traducción literal. Paso 3 ("Aplicar", por lotes con avance en
 * background) no es parte de este incremento — ver `.devsquad/estado.md`;
 * el botón queda visible pero deshabilitado con esa explicación, en vez
 * de omitirlo o fingir que aplica algo que no aplica de verdad. */
export function ImportadorCatalogo() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [modo, setModo] = useState<ModoImportacion>("todo");
  const [resultado, setResultado] = useState<ResultadoAnalisisCsv | null>(null);
  const [filtro, setFiltro] = useState<FiltroFilas>("todas");
  const [error, setError] = useState<string | null>(null);
  const [analizando, setAnalizando] = useState(false);

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
    const encabezado = "sku,nombre,precio,stock,motivo";
    const filas = conError.map((f) => [f.sku, f.nombre, f.precio, f.stock, f.motivo].map((v) => `"${v.replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[encabezado, ...filas].join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "filas-con-error.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!resultado) {
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
          <button className="btn btn-primario cut cut-12" onClick={analizar} disabled={!archivo || analizando}>
            {analizando ? "Revisando…" : "Revisar archivo"}
          </button>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-fantasma cut cut-10" onClick={() => setResultado(null)}>
            ‹ Cambiar archivo
          </button>
          {resultado.conError > 0 && (
            <button className="btn btn-fantasma cut cut-10" onClick={descargarFilasConError}>
              Descargar las {resultado.conError} filas con error
            </button>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <button className="btn btn-primario cut cut-12" disabled title="La aplicación por lotes es la siguiente pieza de este incremento — ver .devsquad/estado.md">
            Aplicar {resultado.correctas} productos
          </button>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, maxWidth: 320 }}>
            Todavía no disponible: esta vista previa ya valida de verdad contra tu catálogo, pero aplicar los cambios en lote es la siguiente pieza a construir.
          </div>
        </div>
      </div>
    </div>
  );
}
