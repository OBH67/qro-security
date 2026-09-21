import { PASOS_FLUJO, ETIQUETA_ESTADO } from "@/lib/pedido";
import type { EstadoPedido } from "@/types/database";

/** index.html:1110-1121/1326-1337 — señal horizontal de progreso del
 * pedido (nodo-línea-nodo por cada estado). Si el pedido está cancelado se
 * muestra un aviso en vez de la señal (no tiene sentido "progreso" hacia
 * un estado que ya no va a alcanzar). */
export function PasosPedido({ estado }: { estado: EstadoPedido }) {
  if (estado === "cancelado") {
    return (
      <div style={{ margin: "24px 0", padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
        <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>Este pedido fue cancelado.</p>
      </div>
    );
  }

  const actual = PASOS_FLUJO.findIndex((p) => p.estado === estado);

  return (
    <div
      role="img"
      aria-label={`Estado del pedido: ${ETIQUETA_ESTADO[estado]}`}
      style={{ display: "flex", gap: 6, alignItems: "flex-start", margin: "28px 0 10px", overflowX: "auto", paddingBottom: 6 }}
    >
      {PASOS_FLUJO.map((paso, i) => {
        const alcanzado = i <= actual;
        return (
          <span key={paso.estado} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "1 1 0", minWidth: 84 }}>
            <span style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <span style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : alcanzado ? "var(--accent)" : "var(--border-subtle)" }} />
              <span style={{ width: 10, height: 10, borderRadius: "50%", flex: "0 0 auto", background: alcanzado ? "var(--accent)" : "var(--border-subtle)" }} />
              <span style={{ flex: 1, height: 2, background: i === PASOS_FLUJO.length - 1 ? "transparent" : i < actual ? "var(--accent)" : "var(--border-subtle)" }} />
            </span>
            <span style={{ fontSize: 11.5, textAlign: "center", color: alcanzado ? "var(--text-primary)" : "var(--text-disabled)" }}>{paso.nombre}</span>
          </span>
        );
      })}
    </div>
  );
}
