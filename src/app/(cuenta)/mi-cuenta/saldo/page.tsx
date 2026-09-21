import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerMovimientosSaldo } from "@/server/db/queries/saldo";
import { formatearPrecio } from "@/lib/formato";

export const metadata: Metadata = { title: "Saldo a favor — SG Querétaro" };
export const dynamic = "force-dynamic";

const ETIQUETA_MOVIMIENTO: Record<string, string> = {
  devolucion: "Devolución aprobada",
  aplicado: "Aplicado a un pedido",
  ajuste: "Ajuste",
};

/** index.html:1285-1305 (`secSaldo`) — traducción literal. */
export default async function PaginaSaldo() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;

  const movimientos = await obtenerMovimientosSaldo(sesion.userId);
  const saldo = movimientos.reduce((suma, m) => suma + Number(m.amount), 0);

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Saldo a favor</h1>

      <div style={{ maxWidth: 680 }}>
        <div
          style={{
            padding: 26,
            border: "1px solid var(--success)",
            background: "var(--success-tint)",
            display: "flex",
            gap: 20,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <span style={{ display: "block", fontSize: 14, color: "var(--text-muted)" }}>Saldo disponible</span>
            <span style={{ display: "block", marginTop: 6, fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 38, color: "var(--success)" }}>
              {formatearPrecio(saldo)}
            </span>
          </div>
          {saldo > 0 && (
            <a
              href="/carrito"
              style={{
                padding: "14px 22px",
                border: "1px solid var(--success)",
                color: "var(--success)",
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: 15,
              }}
            >
              Usar en mi próximo pedido
            </a>
          )}
        </div>

        <h2 style={{ margin: "30px 0 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>Movimientos</h2>
        {movimientos.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Todavía no tienes movimientos de saldo.</p>
        ) : (
          <div style={{ borderTop: "1px solid var(--border)" }}>
            {movimientos.map((m) => {
              const monto = Number(m.amount);
              return (
                <div key={m.id} style={{ display: "flex", gap: 18, alignItems: "center", padding: "16px 0", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", minWidth: 90 }}>
                    {new Date(m.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span style={{ flex: 1, minWidth: 200, fontSize: 14.5, color: "var(--text-primary)" }}>
                    {ETIQUETA_MOVIMIENTO[m.kind] ?? m.kind} — {m.description}
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 16, color: monto >= 0 ? "var(--success)" : "var(--danger-text)" }}>
                    {monto >= 0 ? "+" : "−"}
                    {formatearPrecio(Math.abs(monto))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
