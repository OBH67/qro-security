import Link from "next/link";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerPedidosDeCliente } from "@/server/db/queries/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { ETIQUETA_ESTADO } from "@/lib/pedido";
import { Etiqueta } from "@/components/atoms/Etiqueta";

export const metadata: Metadata = { title: "Mis pedidos — SG Querétaro" };
export const dynamic = "force-dynamic";

/** index.html:1218-1252 (`secPedidos`) — C4: lista con folio, fecha, total
 * y estado actual. */
export default async function PaginaMisPedidos() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null; // el layout ya redirige; guarda de tipos

  const pedidos = await obtenerPedidosDeCliente(sesion.userId);

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Mis pedidos</h1>

      {pedidos.length === 0 ? (
        <p style={{ margin: 0, fontSize: 15.5, color: "var(--text-muted)" }}>
          Todavía no has generado ningún pedido. <Link href="/catalogo" style={{ color: "var(--accent)" }}>Ver catálogo</Link>
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {pedidos.map((o) => (
            <div key={o.id} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 20, display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ minWidth: 170 }}>
                <span className="font-data" style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>{o.folio}</span>
                <span style={{ display: "block", marginTop: 5, fontSize: 13, color: "var(--text-muted)" }}>
                  {new Date(o.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <div style={{ marginTop: 8 }}>
                  <Etiqueta tono={o.status === "cancelado" ? "peligro" : o.status === "pendiente_pago" ? "advertencia" : "exito"}>
                    {ETIQUETA_ESTADO[o.status]}
                  </Etiqueta>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 120, marginLeft: "auto" }}>
                <span className="font-data" style={{ display: "block", fontSize: 22, fontWeight: 600 }}>{formatearPrecio(o.total)}</span>
                <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>IVA incluido</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "stretch" }}>
                {o.status === "pendiente_pago" && o.payment_method === "transferencia" ? (
                  <Link
                    href={`/mi-cuenta/pedidos/${o.folio}/comprobante`}
                    className="clip-corner-sm"
                    style={{ padding: "12px 18px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, background: "var(--accent)", color: "var(--bg-base)", textAlign: "center" }}
                  >
                    Subir comprobante
                  </Link>
                ) : (
                  <Link
                    href={`/mi-cuenta/pedidos/${o.folio}`}
                    className="clip-corner-sm"
                    style={{ padding: "12px 18px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14, border: "1px solid var(--accent)", color: "var(--accent)", textAlign: "center" }}
                  >
                    Ver detalle
                  </Link>
                )}
                <Link href={`/mi-cuenta/pedidos/${o.folio}`} style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                  Ver detalle
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
