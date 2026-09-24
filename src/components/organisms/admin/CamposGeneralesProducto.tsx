import type { DatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import type { CondicionProducto, GroupRow, SubcategoryRow } from "@/types/database";

export const MOTIVOS_POR_CONDICION: Record<Exclude<CondicionProducto, "nuevo">, string[]> = {
  caja_abierta: ["Empaque abierto, producto sin usar", "Caja dañada en tránsito", "Devolución sin abrir el sello del producto", "Otro"],
  usado: ["Usado para prueba", "Incompleto — faltan piezas", "Unidad de exhibición", "Otro"],
};

/**
 * panel-admin-maqueta.html:560-709 (`isNuevoProducto`) — campos de la
 * pestaña/paso "General", extraídos de `FormularioProducto.tsx` para que
 * el editor de producto (pestañas, edición) y el asistente de alta
 * (wizard, creación) compartan exactamente el mismo formulario en vez de
 * mantener dos copias del mismo JSX.
 */
export function CamposGeneralesProducto({
  esEdicion,
  sku,
  onCambiarSku = () => {},
  name,
  onCambiarName,
  description,
  onCambiarDescription,
  brandId,
  onCambiarBrandId,
  groupId,
  onCambiarGrupo,
  subcategoryId,
  onCambiarSubcategoria,
  subcategorias,
  status,
  onCambiarStatus,
  price,
  onCambiarPrice,
  stock,
  onCambiarStock,
  condition,
  onElegirCondicion,
  conditionDetail,
  onCambiarConditionDetail,
  datosFormulario,
  notaFotoPrincipal = 'Sube fotos desde la pestaña "Fotos" tras guardar el producto.',
}: {
  esEdicion: boolean;
  sku: string;
  onCambiarSku?: (v: string) => void;
  name: string;
  onCambiarName: (v: string) => void;
  description: string | null;
  onCambiarDescription: (v: string) => void;
  brandId: string | null;
  onCambiarBrandId: (v: string) => void;
  groupId: string;
  onCambiarGrupo: (v: string) => void;
  subcategoryId: string;
  onCambiarSubcategoria: (v: string) => void;
  subcategorias: SubcategoryRow[];
  status: "activo" | "agotado" | "descontinuado";
  onCambiarStatus: (v: "activo" | "agotado" | "descontinuado") => void;
  price: number | string;
  onCambiarPrice: (v: string) => void;
  stock: number | string;
  onCambiarStock: (v: number | "") => void;
  condition: CondicionProducto;
  onElegirCondicion: (v: CondicionProducto) => void;
  conditionDetail: string | null;
  onCambiarConditionDetail: (v: string) => void;
  datosFormulario: { grupos: GroupRow[]; marcas: DatosFormularioProducto["marcas"] };
  notaFotoPrincipal?: string;
}) {
  return (
    <div className="admin-grid-2-ancho" style={{ gap: 20 }}>
      <div className="tarjeta" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="admin-grid-2" style={{ gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>SKU *</label>
            <input className="campo mono" value={sku} onChange={(e) => onCambiarSku(e.target.value)} placeholder="SGQ-VV-0000" disabled={esEdicion} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Estado *</label>
            <select className="campo" value={status} onChange={(e) => onCambiarStatus(e.target.value as typeof status)}>
              <option value="activo">Activo</option>
              <option value="agotado">Agotado</option>
              <option value="descontinuado">Descontinuado</option>
            </select>
          </div>
        </div>
        <div>
          <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Nombre *</label>
          <input className="campo" value={name} onChange={(e) => onCambiarName(e.target.value)} placeholder="Cámara IP bala 4 MP con detección de personas y vehículos" />
        </div>
        <div className="admin-grid-2" style={{ gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Precio (con IVA) *</label>
            <input className="campo mono" type="number" min={0} step="0.01" value={price} onChange={(e) => onCambiarPrice(e.target.value)} placeholder="1289.00" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Marca</label>
            <select className="campo" value={brandId ?? ""} onChange={(e) => onCambiarBrandId(e.target.value)}>
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
              <select className="campo" value={groupId} onChange={(e) => onCambiarGrupo(e.target.value)}>
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
              <select className="campo" value={subcategoryId} onChange={(e) => onCambiarSubcategoria(e.target.value)} disabled={!groupId}>
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
          <textarea className="campo" style={{ height: 88, paddingTop: 10 }} value={description ?? ""} onChange={(e) => onCambiarDescription(e.target.value)} placeholder="Descripción larga para la ficha del producto" />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="tarjeta" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Foto principal</div>
          <div style={{ background: "var(--bg-inset)", border: "1px dashed var(--border-input)", height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 12, textAlign: "center", padding: 10 }}>
            {notaFotoPrincipal}
          </div>
        </div>
        <div className="tarjeta" style={{ padding: 18 }}>
          <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Condición (D6)</div>
          <div style={{ display: "flex", gap: 18, fontSize: 14, marginBottom: 4 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <input type="radio" name="condicion" checked={condition === "nuevo"} onChange={() => onElegirCondicion("nuevo")} /> Nuevo
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <input type="radio" name="condicion" checked={condition === "caja_abierta"} onChange={() => onElegirCondicion("caja_abierta")} /> Caja abierta
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <input type="radio" name="condicion" checked={condition === "usado"} onChange={() => onElegirCondicion("usado")} /> Usado
            </label>
          </div>
          {condition === "nuevo" && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
              <label style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Stock inicial *</label>
              <input className="campo mono" type="number" min={0} step="1" value={stock} onChange={(e) => onCambiarStock(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
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
                <select className="campo" value={conditionDetail ?? ""} onChange={(e) => onCambiarConditionDetail(e.target.value)}>
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
  );
}
