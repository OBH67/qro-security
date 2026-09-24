"use client";

import { useState } from "react";
import { iniciarSubidaDocumentoProductoAction, confirmarDocumentoProductoAction, eliminarDocumentoProductoAction } from "@/server/actions/admin/productoArchivos";
import { urlImagenPublica } from "@/lib/imagenes";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import type { ProductDocumentRow } from "@/types/database";

const ETIQUETA_KIND: Record<ProductDocumentRow["kind"], string> = { ficha_tecnica: "Ficha técnica", manual: "Manual", otro: "Otro" };

function formatearTamano(bytes: number | null): string {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/** F1.4, pestaña "Documentos" — solo PDF (`validarDocumentoProducto`),
 * mismo flujo de firma+PUT+confirmación que la pestaña "Fotos". */
export function GestorDocumentosProducto({ productId, sku, documentosIniciales }: { productId: string; sku: string; documentosIniciales: ProductDocumentRow[] }) {
  const [documentos, setDocumentos] = useState<ProductDocumentRow[]>(documentosIniciales);
  const [kind, setKind] = useState<ProductDocumentRow["kind"]>("ficha_tecnica");
  const [subiendo, setSubiendo] = useState(false);
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function elegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length === 0) return;
    setError(null);
    setSubiendo(true);

    for (const archivo of archivos) {
      try {
        const firma = await iniciarSubidaDocumentoProductoAction({ sku, nombreArchivo: archivo.name, contentType: archivo.type });
        if (!firma.ok) {
          setError(firma.error);
          continue;
        }
        const subida = await fetch(firma.data.url, { method: "PUT", body: archivo, headers: { "Content-Type": archivo.type } });
        if (!subida.ok) {
          setError(`No se pudo subir "${archivo.name}".`);
          continue;
        }
        const confirmacion = await confirmarDocumentoProductoAction({ productId, key: firma.data.key, nombre: archivo.name, kind });
        if (!confirmacion.ok) {
          setError(confirmacion.error);
          continue;
        }
        setDocumentos((d) => [...d, confirmacion.data]);
      } catch (error) {
        // Ver la misma nota en GestorFotosProducto.tsx sobre por qué el PUT
        // a R2 puede rechazar la promesa (CORS) en vez de solo fallar con
        // `ok: false`.
        setError(
          `No se pudo subir "${archivo.name}" (${error instanceof Error ? error.message : "error de red"}). ` +
            "Si el problema sigue, puede ser la política CORS del bucket público de R2 — avísale a soporte.",
        );
      }
    }
    setSubiendo(false);
  }

  async function eliminar(id: string) {
    setEnCurso(id);
    setError(null);
    const resultado = await eliminarDocumentoProductoAction(productId, id);
    setEnCurso(null);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setDocumentos((d) => d.filter((doc) => doc.id !== id));
  }

  return (
    <div className="tarjeta" style={{ padding: 20 }}>
      <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Documentos del producto</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Fichas técnicas, manuales u otros PDF que el cliente puede descargar desde la ficha del producto.</div>

      {documentos.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {documentos.map((doc) => (
            <div key={doc.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--bg-inset)", border: "1px solid var(--border)" }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <a href={urlImagenPublica(doc.url)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                  {doc.name}
                </a>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {ETIQUETA_KIND[doc.kind]} · {formatearTamano(doc.size_bytes)}
                </span>
              </span>
              <BotonAdmin type="button" variante="peligro" tamano="sm" onClick={() => eliminar(doc.id)} cargando={enCurso === doc.id} textoCargando="…">
                Eliminar
              </BotonAdmin>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <select className="campo" style={{ width: "auto" }} value={kind} onChange={(e) => setKind(e.target.value as ProductDocumentRow["kind"])} disabled={subiendo}>
          <option value="ficha_tecnica">Ficha técnica</option>
          <option value="manual">Manual</option>
          <option value="otro">Otro</option>
        </select>
        <label className="btn btn-secundario cut cut-10" style={{ display: "inline-flex", cursor: subiendo ? "wait" : "pointer", opacity: subiendo ? 0.7 : 1 }}>
          {subiendo ? "Subiendo…" : "Agregar PDF"}
          <input type="file" accept="application/pdf,.pdf" multiple onChange={elegirArchivos} disabled={subiendo} style={{ display: "none" }} />
        </label>
      </div>
      {error && <p style={{ marginTop: 12, fontSize: 13, color: "var(--danger-text)" }}>{error}</p>}
    </div>
  );
}
