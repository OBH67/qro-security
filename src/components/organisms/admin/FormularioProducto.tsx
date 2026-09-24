"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearProductoAction, actualizarProductoAction } from "@/server/actions/admin/catalogo";
import { obtenerAtributosDeCategoriaAction } from "@/server/actions/admin/productoArchivos";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import { GestorFotosProducto } from "@/components/organisms/admin/GestorFotosProducto";
import { GestorDocumentosProducto } from "@/components/organisms/admin/GestorDocumentosProducto";
import { EditorEspecificacionesProducto } from "@/components/organisms/admin/EditorEspecificacionesProducto";
import type { DatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import type { CondicionProducto, ProductRow, ProductImageRow, ProductDocumentRow, CategoryAttributeRow } from "@/types/database";

const PESTAÑAS = ["General", "Fotos", "Especificaciones", "Documentos"] as const;
const MOTIVOS_POR_CONDICION: Record<Exclude<CondicionProducto, "nuevo">, string[]> = {
  caja_abierta: ["Empaque abierto, producto sin usar", "Caja dañada en tránsito", "Devolución sin abrir el sello del producto", "Otro"],
  usado: ["Usado para prueba", "Incompleto — faltan piezas", "Unidad de exhibición", "Otro"],
};

/** panel-admin-maqueta.html:560-709 (`isNuevoProducto`) — traducción
 * literal de la pestaña "General" (la única que la maqueta construyó
 * completa). Comportamiento de "Usado" (stock fijo en 1, SKU sugerido con
 * sufijo) viene de diseño.md §11.7, que cubre lo que la maqueta no mostró
 * por ser estático.
 *
 * Fotos/Especificaciones/Documentos (F1.4) solo se pueden editar sobre un
 * producto ya guardado — `product_images`/`product_documents` tienen FK a
 * `products.id`, y las especificaciones dependen de la categoría elegida
 * en "General". Al crear un producto nuevo esas 3 pestañas muestran un
 * aviso de "guarda primero" en vez de su contenido real. */
export function FormularioProducto({
  producto,
  datosFormulario,
  galeriaInicial = [],
  documentosIniciales = [],
  atributosDeCategoria = [],
}: {
  producto?: ProductRow;
  datosFormulario: DatosFormularioProducto;
  galeriaInicial?: ProductImageRow[];
  documentosIniciales?: ProductDocumentRow[];
  atributosDeCategoria?: CategoryAttributeRow[];
}) {
  const router = useRouter();
  const esEdicion = !!producto;
  const [tab, setTab] = useState<(typeof PESTAÑAS)[number]>("General");
  const [sku, setSku] = useState(producto?.sku ?? "");
  const [name, setName] = useState(producto?.name ?? "");
  const [description, setDescription] = useState(producto?.description ?? "");
  const [brandId, setBrandId] = useState(producto?.brand_id ?? "");
  const [groupId, setGroupId] = useState(producto?.group_id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(producto?.subcategory_id ?? "");
  const [status, setStatus] = useState<"activo" | "agotado" | "descontinuado">(producto?.status ?? "activo");
  const [price, setPrice] = useState(producto?.price ?? "");
  const [stock, setStock] = useState(producto?.stock ?? "");
  const [condition, setCondition] = useState<CondicionProducto>(producto?.condition ?? "nuevo");
  const [conditionDetail, setConditionDetail] = useState(producto?.condition_detail ?? MOTIVOS_POR_CONDICION.usado[0]);
  const [atributos, setAtributos] = useState<CategoryAttributeRow[]>(atributosDeCategoria);
  const [attributes, setAttributes] = useState<Record<string, string | number | boolean>>((producto?.attributes as Record<string, string | number | boolean>) ?? {});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const subcategorias = useMemo(() => datosFormulario.subcategoriasPorGrupo.get(groupId) ?? [], [groupId, datosFormulario]);

  function elegirCondicion(nueva: CondicionProducto) {
    setCondition(nueva);
    if (nueva !== "nuevo") {
      setConditionDetail(MOTIVOS_POR_CONDICION[nueva][0]);
      if (esEdicion === false && sku && !sku.endsWith("-U1")) setSku(`${sku}-U1`);
    }
  }

  async function elegirSubcategoria(nuevaSubcategoryId: string) {
    setSubcategoryId(nuevaSubcategoryId);
    if (!esEdicion || !groupId || !nuevaSubcategoryId) return;
    const resultado = await obtenerAtributosDeCategoriaAction(groupId, nuevaSubcategoryId);
    if (resultado.ok) {
      setAtributos(resultado.data);
      setAttributes({});
    }
  }

  function guardar() {
    setError(null);
    const datos = {
      sku: esEdicion ? undefined : sku,
      name,
      description,
      brandId,
      groupId,
      subcategoryId,
      price,
      stock: condition === "nuevo" ? stock : undefined,
      status,
      condition,
      conditionDetail: condition !== "nuevo" ? conditionDetail : "",
      attributes: esEdicion ? attributes : undefined,
    };
    startTransition(async () => {
      const resultado = esEdicion ? await actualizarProductoAction(producto!.id, datos) : await crearProductoAction(datos);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      router.push("/admin/catalogo");
      router.refresh();
    });
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
        <Link href="/admin/catalogo" style={{ fontSize: 13 }}>
          ‹ Catálogo
        </Link>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <h1 className="title" style={{ fontSize: 22, margin: 0 }}>
          {esEdicion ? `Editar ${producto!.name}` : "Nuevo producto"}
        </h1>
      </div>

      <div style={{ display: "flex", gap: 4, margin: "18px 0", borderBottom: "1px solid var(--border)" }}>
        {PESTAÑAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{ background: "none", border: "none", padding: "10px 16px", fontFamily: "var(--font-title)", fontWeight: 500, fontSize: 14, color: t === tab ? "var(--accent)" : "var(--text-muted)", borderBottom: `2px solid ${t === tab ? "var(--accent)" : "transparent"}`, cursor: "pointer" }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "General" ? (
        <div className="admin-grid-2-ancho" style={{ gap: 20 }}>
          <div className="tarjeta" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="admin-grid-2" style={{ gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>SKU *</label>
                <input className="campo mono" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SGQ-VV-0000" disabled={esEdicion} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Estado *</label>
                <select className="campo" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                  <option value="activo">Activo</option>
                  <option value="agotado">Agotado</option>
                  <option value="descontinuado">Descontinuado</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Nombre *</label>
              <input className="campo" value={name} onChange={(e) => setName(e.target.value)} placeholder="Cámara IP bala 4 MP con detección de personas y vehículos" />
            </div>
            <div className="admin-grid-2" style={{ gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Precio (con IVA) *</label>
                <input className="campo mono" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1289.00" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Marca</label>
                <select className="campo" value={brandId ?? ""} onChange={(e) => setBrandId(e.target.value)}>
                  <option value="">Sin marca</option>
                  {datosFormulario.marcas.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <div className="title" style={{ fontSize: 14, marginBottom: 2 }}>
                Categoría del producto
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Grupo y subcategoría del árbol (D7). Un producto siempre queda en el nivel más específico disponible.</div>
              <div className="admin-grid-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6, fontFamily: "var(--font-title)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>① Grupo *</label>
                  <select
                    className="campo"
                    value={groupId}
                    onChange={(e) => {
                      setGroupId(e.target.value);
                      setSubcategoryId("");
                    }}
                  >
                    <option value="">Elige un grupo…</option>
                    {datosFormulario.grupos.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6, fontFamily: "var(--font-title)", fontWeight: 600, letterSpacing: 0.3, textTransform: "uppercase" }}>② Subcategoría *</label>
                  <select className="campo" value={subcategoryId} onChange={(e) => elegirSubcategoria(e.target.value)} disabled={!groupId}>
                    <option value="">{groupId ? "Elige una subcategoría…" : "Elige primero un grupo"}</option>
                    {subcategorias.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Descripción</label>
              <textarea className="campo" style={{ height: 88, paddingTop: 10 }} value={description ?? ""} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción larga para la ficha del producto" />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="tarjeta" style={{ padding: 18 }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Foto principal</div>
              <div style={{ background: "var(--bg-inset)", border: "1px dashed var(--border-input)", height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 12, textAlign: "center", padding: 10 }}>
                Sube fotos desde la pestaña &ldquo;Fotos&rdquo; tras guardar el producto.
              </div>
            </div>
            <div className="tarjeta" style={{ padding: 18 }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Condición (D6)</div>
              <div style={{ display: "flex", gap: 18, fontSize: 14, marginBottom: 4 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input type="radio" name="condicion" checked={condition === "nuevo"} onChange={() => elegirCondicion("nuevo")} /> Nuevo
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input type="radio" name="condicion" checked={condition === "caja_abierta"} onChange={() => elegirCondicion("caja_abierta")} /> Caja abierta
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
                  <input type="radio" name="condicion" checked={condition === "usado"} onChange={() => elegirCondicion("usado")} /> Usado
                </label>
              </div>
              {condition === "nuevo" && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Stock inicial *</label>
                  <input className="campo mono" type="number" min={0} step="1" value={stock} onChange={(e) => setStock(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
                </div>
              )}
              {condition !== "nuevo" && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Stock</label>
                    <div className="campo mono" style={{ display: "flex", alignItems: "center", color: "var(--text-dim)", background: "var(--bg-surface)" }}>
                      1 (pieza única)
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Motivo visible al cliente *</label>
                    <select className="campo" value={conditionDetail ?? ""} onChange={(e) => setConditionDetail(e.target.value)}>
                      {MOTIVOS_POR_CONDICION[condition].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--warning)", lineHeight: 1.5, background: "var(--warning-tint)", border: "1px solid var(--warning)", padding: 10 }}>
                    Esta ficha se publica aparte del producto nuevo, con su propio precio y su propia foto real. Sube una foto de la pieza, no la del catálogo.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : !esEdicion ? (
        <div className="tarjeta" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
          Guarda el producto en &ldquo;General&rdquo; primero — {tab === "Fotos" ? "las fotos" : tab === "Documentos" ? "los documentos" : "las especificaciones"} se agregan después, sobre el producto ya creado.
        </div>
      ) : tab === "Fotos" ? (
        <GestorFotosProducto productId={producto!.id} sku={producto!.sku} nombreProducto={name || producto!.name} galeriaInicial={galeriaInicial} />
      ) : tab === "Documentos" ? (
        <GestorDocumentosProducto productId={producto!.id} sku={producto!.sku} documentosIniciales={documentosIniciales} />
      ) : (
        <EditorEspecificacionesProducto atributos={atributos} valores={attributes} onCambiar={(key, valor) => setAttributes((a) => ({ ...a, [key]: valor }))} />
      )}

      {error && <p style={{ marginTop: 18, fontSize: 14, color: "var(--danger-text)" }}>{error}</p>}

      <div style={{ position: "sticky", bottom: 0, background: "var(--bg-surface)", borderTop: "1px solid var(--border)", padding: "14px 0", marginTop: 24, display: "flex", justifyContent: "space-between" }}>
        <Link href="/admin/catalogo" className="btn btn-fantasma cut cut-10">
          Cancelar
        </Link>
        <BotonAdmin type="button" className="cut cut-12" onClick={guardar} cargando={isPending} textoCargando="Guardando…">
          Guardar
        </BotonAdmin>
      </div>
    </div>
  );
}
