import type { Metadata } from "next";
import Link from "next/link";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerDevolucionesDeCliente } from "@/server/db/queries/devoluciones";
import { formatearPrecio } from "@/lib/formato";
import type { EstadoDevolucion } from "@/types/database";

export const metadata: Metadata = { title: "Devoluciones — SG Querétaro" };
export const dynamic = "force-dynamic";

const ESTADO: Record<EstadoDevolucion, { etiqueta: string; color: string }> = {
  solicitada: { etiqueta: "Solicitada", color: "var(--text-muted)" },
  en_revision: { etiqueta: "En revisión", color: "var(--warning)" },
  aprobada: { etiqueta: "Aprobada", color: "var(--success)" },
  rechazada: { etiqueta: "Rechazada", color: "var(--danger-text)" },
};

const CONDICION: Record<string, string> = { sellado: "Sellado de fábrica", abierto: "Abierto o sin empaque", otro: "Otro" };

/** index.html:1307-1315 (`secDevoluciones`) — el blurb + los 2 botones son
 * literales del demo. La lista de solicitudes debajo NO está en el demo
 * (`newReturn` ahí solo es un toast, ver `estado.md`) — se agrega porque
 * sin ella el cliente no tendría forma de ver el estado de lo que ya
 * pidió, igual que ya existe para "Mis pedidos". */
export default async function PaginaDevolucionesCliente() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;

  const devoluciones = await obtenerDevolucionesDeCliente(sesion.userId);

  return (
    <div>
      <h1 className="cuenta-escritorio-solo" style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Devoluciones</h1>

      <div className="cuenta-escritorio-solo" style={{ maxWidth: 680 }}>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.65, color: "var(--text-muted)" }}>
          Las devoluciones se abonan como saldo a favor para comprar productos: 100% del valor si el producto está sellado de fábrica y 70% si está
          abierto o sin empaque.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 22 }}>
          <Link
            href="/mi-cuenta/devoluciones/nueva"
            style={{ padding: "14px 22px", background: "var(--accent)", color: "var(--bg-base)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}
          >
            Solicitar devolución
          </Link>
          <Link href="/devoluciones" style={{ padding: "14px 22px", border: "1px solid var(--border)", color: "var(--text-primary)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15 }}>
            Ver la política completa
          </Link>
        </div>
      </div>

      {/* Mockup `Panel_Usuario_Movil.dc.html` (`secDevoluciones`,
          `devCards`) — traducción literal: 2 tarjetas de política +
          disclaimer + los mismos 2 botones. */}
      <div className="cuenta-movil-solo">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <TarjetaPoliticaMovil pct="100%" titulo="Producto sellado" detalle="Se abona el valor completo como saldo a favor." color="#45E39A" />
          <TarjetaPoliticaMovil pct="70%" titulo="Abierto o sin empaque" detalle="Se abona el 70% de su valor como saldo a favor." color="#FFB547" />
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 13.5, lineHeight: 1.6, color: "#7E93A6" }}>
          El valor se abona como saldo a favor para comprar productos; no hay reembolso en efectivo.
        </p>
        <Link
          href="/mi-cuenta/devoluciones/nueva"
          className="clip-corner-lg"
          style={{ display: "block", width: "100%", marginTop: 18, padding: 15, background: "#3CE7FF", color: "#07111C", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 15.5, textAlign: "center" }}
        >
          Solicitar devolución
        </Link>
        <Link
          href="/devoluciones"
          style={{ display: "block", width: "100%", marginTop: 10, padding: 14, border: "1px solid #1F3244", color: "#EAF2F8", fontSize: 14.5, textAlign: "center" }}
        >
          Ver la política completa
        </Link>
      </div>

      {devoluciones.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>Tus solicitudes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {devoluciones.map((d) => {
              const estado = ESTADO[d.status];
              const totalEstimado = d.items.reduce((s, it) => s + Number(it.credit_amount), 0);
              return (
                <div key={d.id} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 20 }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 15, color: "var(--text-primary)" }}>{d.folio}</span>
                      <span style={{ display: "block", marginTop: 4, fontSize: 13, color: "var(--text-muted)" }}>
                        {new Date(d.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14, color: estado.color }}>{estado.etiqueta}</span>
                  </div>
                  <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    {d.items.map((it) => (
                      <span key={it.id} style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                        {it.qty} × pieza — {CONDICION[it.condition] ?? it.condition}
                        {d.status === "rechazada" ? "" : ` · ${it.condition === "otro" ? "lo revisa un asesor" : `${it.percentage}% estimado (${formatearPrecio(it.credit_amount)})`}`}
                      </span>
                    ))}
                  </div>
                  {d.status === "aprobada" && d.credit_amount && (
                    <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--success)" }}>Saldo abonado: {formatearPrecio(d.credit_amount)}</p>
                  )}
                  {d.status === "rechazada" && d.resolution_note && (
                    <p style={{ margin: "12px 0 0", fontSize: 14, color: "var(--danger-text)" }}>Motivo: {d.resolution_note}</p>
                  )}
                  {d.status === "solicitada" && totalEstimado > 0 && (
                    <p style={{ margin: "12px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Saldo estimado, sujeto a revisión: {formatearPrecio(totalEstimado)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TarjetaPoliticaMovil({ pct, titulo, detalle, color }: { pct: string; titulo: string; detalle: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: 15, border: `1px solid ${color}55`, background: "#0F1D2B" }}>
      <span style={{ flex: "0 0 auto", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 700, fontSize: 22, color }}>{pct}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 15.5, color: "#EAF2F8" }}>{titulo}</span>
        <span style={{ display: "block", marginTop: 3, fontSize: 13, lineHeight: 1.5, color: "#9FB2C3" }}>{detalle}</span>
      </span>
    </div>
  );
}
