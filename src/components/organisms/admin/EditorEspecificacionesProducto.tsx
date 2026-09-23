import type { CategoryAttributeRow } from "@/types/database";

/**
 * F1.4, pestaña "Especificaciones" — un campo por cada `category_
 * attributes` del grupo/subcategoría del producto (D1). Componente
 * controlado puro: no dispara ninguna acción propia, sus valores viajan
 * en el mismo `attributes` que manda el botón "Guardar" general del
 * formulario (diseño.md §11.7: una sola barra de guardar para todo el
 * producto, no una por pestaña).
 */
export function EditorEspecificacionesProducto({
  atributos,
  valores,
  onCambiar,
}: {
  atributos: CategoryAttributeRow[];
  valores: Record<string, string | number | boolean>;
  onCambiar: (key: string, valor: string | number | boolean) => void;
}) {
  if (atributos.length === 0) {
    return (
      <div className="tarjeta" style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
        Esta categoría no tiene especificaciones configurables todavía.
      </div>
    );
  }

  return (
    <div className="tarjeta" style={{ padding: 20 }}>
      <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>Especificaciones</div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Definidas por la categoría del producto — se muestran en su ficha y sirven como filtros del catálogo (D1).</div>

      <div className="admin-grid-2" style={{ gap: 16 }}>
        {[...atributos]
          .sort((a, b) => a.position - b.position)
          .map((attr) => (
            <div key={attr.id}>
              <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>{attr.label}</label>
              {attr.data_type === "boolean" ? (
                <label style={{ display: "flex", alignItems: "center", gap: 8, height: 44 }}>
                  <input type="checkbox" checked={Boolean(valores[attr.key])} onChange={(e) => onCambiar(attr.key, e.target.checked)} />
                  <span style={{ fontSize: 14 }}>{valores[attr.key] ? "Sí" : "No"}</span>
                </label>
              ) : attr.options && attr.options.length > 0 ? (
                <select className="campo" value={String(valores[attr.key] ?? "")} onChange={(e) => onCambiar(attr.key, e.target.value)}>
                  <option value="">Sin especificar</option>
                  {attr.options.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              ) : attr.data_type === "number" ? (
                <input className="campo mono" type="number" value={valores[attr.key] === undefined ? "" : String(valores[attr.key])} onChange={(e) => onCambiar(attr.key, e.target.value === "" ? "" : Number(e.target.value))} />
              ) : (
                <input className="campo" value={String(valores[attr.key] ?? "")} onChange={(e) => onCambiar(attr.key, e.target.value)} />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
