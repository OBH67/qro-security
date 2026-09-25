import { pasosFlujo, etiquetaEstadoCliente } from "@/lib/pedido";
import { formatearFechaLimite } from "@/lib/pagos/fechaLimite";
import type { EstadoPedido, MetodoPago } from "@/types/database";

const NOMBRE_METODO: Record<MetodoPago, string> = {
  transferencia: "Transferencia",
  saldo_completo: "Saldo a favor",
  tarjeta: "Tarjeta",
  oxxo: "OXXO",
  spei: "SPEI",
};

/** index.html:1110-1121/1326-1337 — señal horizontal de progreso del
 * pedido (nodo-línea-nodo por cada estado). Si el pedido está cancelado se
 * muestra un aviso en vez de la señal (no tiene sentido "progreso" hacia
 * un estado que ya no va a alcanzar).
 *
 * diseño-pagos-stripe.md §5.1: la línea de tiempo depende del método
 * (`pasosFlujo()`, `lib/pedido.ts`) — comprobante sigue igual; tarjeta/
 * OXXO/SPEI agregan el paso "Pago en proceso" (anillo violeta que gira,
 * `sgSpin`) y renombran el paso final a "Pago recibido". El punto de
 * `pago_en_proceso` lleva una segunda línea con el método y, si aplica, la
 * fecha límite — la única diferencia visual real frente al resto de los
 * puntos, que solo llevan la etiqueta. */
export function PasosPedido({
  estado,
  metodo = "transferencia",
  expiresAt,
}: {
  estado: EstadoPedido;
  metodo?: MetodoPago;
  expiresAt?: string | null;
}) {
  if (estado === "cancelado") {
    return (
      <div style={{ margin: "24px 0", padding: "14px 18px", border: "1px solid var(--danger-text)", background: "rgba(255,77,94,.07)" }}>
        <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-primary)" }}>Este pedido fue cancelado.</p>
      </div>
    );
  }

  const pasos = pasosFlujo(metodo);
  const actual = pasos.findIndex((p) => p.estado === estado);

  return (
    <div
      role="img"
      aria-label={`Estado del pedido: ${etiquetaEstadoCliente(estado, metodo)}`}
      style={{ display: "flex", gap: 6, alignItems: "flex-start", margin: "28px 0 10px", overflowX: "auto", paddingBottom: 6 }}
    >
      {pasos.map((paso, i) => {
        const alcanzado = i <= actual;
        const esPagoEnProceso = paso.estado === "pago_en_proceso";
        return (
          <span key={paso.estado} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: "1 1 0", minWidth: 84 }}>
            <span style={{ display: "flex", alignItems: "center", width: "100%" }}>
              <span style={{ flex: 1, height: 2, background: i === 0 ? "transparent" : alcanzado ? "var(--accent)" : "var(--border-subtle)" }} />
              {esPagoEnProceso && estado === "pago_en_proceso" ? (
                <span
                  aria-hidden="true"
                  style={{
                    width: 14,
                    height: 14,
                    flex: "0 0 auto",
                    borderRadius: "50%",
                    border: "2px solid var(--processing)",
                    borderTopColor: "transparent",
                    background: "var(--bg-base)",
                    animation: "sgSpin 1.4s linear infinite",
                  }}
                />
              ) : (
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    flex: "0 0 auto",
                    background: esPagoEnProceso && alcanzado ? "var(--processing)" : alcanzado ? "var(--accent)" : "var(--border-subtle)",
                  }}
                />
              )}
              <span style={{ flex: 1, height: 2, background: i === pasos.length - 1 ? "transparent" : i < actual ? "var(--accent)" : "var(--border-subtle)" }} />
            </span>
            <span style={{ fontSize: 11.5, textAlign: "center", color: alcanzado ? "var(--text-primary)" : "var(--text-disabled)" }}>{paso.nombre}</span>
            {esPagoEnProceso && estado === "pago_en_proceso" && (
              <span style={{ fontSize: 11, textAlign: "center", color: "var(--processing)" }}>
                {NOMBRE_METODO[metodo]}
                {expiresAt && metodo !== "tarjeta" ? ` · vence ${formatearFechaLimite(expiresAt).split(",")[0]}` : ""}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
