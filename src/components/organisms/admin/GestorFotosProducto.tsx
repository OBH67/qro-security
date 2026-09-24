"use client";

import { useState } from "react";
import Image from "next/image";
import { iniciarSubidaFotoProductoAction, confirmarFotoProductoAction, eliminarFotoProductoAction, reordenarFotosProductoAction } from "@/server/actions/admin/productoArchivos";
import { urlImagenPublica } from "@/lib/imagenes";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import type { ProductImageRow } from "@/types/database";

/** F1.4, pestaña "Fotos" (diseño.md §11.7: "FOTO PRINCIPAL" + galería
 * `[▣][▣][▣][+]`) — la foto con `position` más baja es la principal
 * (mismo criterio que `obtenerImagenesPrincipales()`, lado público). */
export function GestorFotosProducto({ productId, sku, nombreProducto, galeriaInicial }: { productId: string; sku: string; nombreProducto: string; galeriaInicial: ProductImageRow[] }) {
  const [fotos, setFotos] = useState<ProductImageRow[]>([...galeriaInicial].sort((a, b) => a.position - b.position));
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
        const firma = await iniciarSubidaFotoProductoAction({ sku, nombreArchivo: archivo.name, contentType: archivo.type });
        if (!firma.ok) {
          setError(firma.error);
          continue;
        }
        const subida = await fetch(firma.data.url, { method: "PUT", body: archivo, headers: { "Content-Type": archivo.type } });
        if (!subida.ok) {
          setError(`No se pudo subir "${archivo.name}".`);
          continue;
        }
        const confirmacion = await confirmarFotoProductoAction({ productId, key: firma.data.key, alt: nombreProducto });
        if (!confirmacion.ok) {
          setError(confirmacion.error);
          continue;
        }
        setFotos((f) => [...f, confirmacion.data]);
      } catch (error) {
        // Igual que en FormularioComprobante.tsx: el PUT directo navegador→R2
        // puede RECHAZAR la promesa (no resolver con `ok: false`) por un
        // bloqueo de CORS del bucket público — sin esta pista, el mensaje
        // sería indistinguible de cualquier otro fallo de red.
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
    const resultado = await eliminarFotoProductoAction(productId, id);
    setEnCurso(null);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setFotos((f) => f.filter((foto) => foto.id !== id));
  }

  async function hacerPrincipal(id: string) {
    const nuevoOrden = [id, ...fotos.filter((f) => f.id !== id).map((f) => f.id)];
    setEnCurso(id);
    setError(null);
    const resultado = await reordenarFotosProductoAction(productId, nuevoOrden);
    setEnCurso(null);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setFotos((f) => nuevoOrden.map((idOrdenado, indice) => ({ ...f.find((foto) => foto.id === idOrdenado)!, position: indice })).sort((a, b) => a.position - b.position));
  }

  return (
    <div className="tarjeta" style={{ padding: 20 }}>
      <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Fotos del producto</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>La primera foto (marcada &ldquo;Principal&rdquo;) es la que se ve en el catálogo y las tarjetas de producto.</div>

      {fotos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 14, marginBottom: 18 }}>
          {fotos.map((foto, indice) => (
            <div key={foto.id} className="tarjeta" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ position: "relative", width: "100%", aspectRatio: "1 / 1", background: "var(--bg-inset)" }}>
                <Image src={urlImagenPublica(foto.url)} alt={foto.alt ?? nombreProducto} fill sizes="140px" style={{ objectFit: "cover" }} />
                {indice === 0 && (
                  <span className="badge" style={{ position: "absolute", top: 6, left: 6, background: "var(--accent)", color: "var(--bg-base)" }}>
                    Principal
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {indice !== 0 && (
                  <BotonAdmin type="button" variante="secundario" tamano="sm" style={{ flex: 1 }} onClick={() => hacerPrincipal(foto.id)} cargando={enCurso === foto.id} textoCargando="…">
                    Principal
                  </BotonAdmin>
                )}
                <BotonAdmin type="button" variante="peligro" tamano="sm" style={{ flex: indice === 0 ? 1 : "none" }} onClick={() => eliminar(foto.id)} cargando={enCurso === foto.id} textoCargando="…">
                  Eliminar
                </BotonAdmin>
              </div>
            </div>
          ))}
        </div>
      )}

      <label className="btn btn-secundario cut cut-10" style={{ display: "inline-flex", cursor: subiendo ? "wait" : "pointer", opacity: subiendo ? 0.7 : 1 }}>
        {subiendo ? "Subiendo…" : "Agregar fotos"}
        <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" multiple onChange={elegirArchivos} disabled={subiendo} style={{ display: "none" }} />
      </label>
      {error && <p style={{ marginTop: 12, fontSize: 13, color: "var(--danger-text)" }}>{error}</p>}
    </div>
  );
}
