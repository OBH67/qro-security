import Link from "next/link";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerPedidosDeCliente, type PedidoDeLista } from "@/server/db/queries/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { etiquetaEstadoCliente, esMetodoStripe } from "@/lib/pedido";
import { formatearFechaLimiteEnFrase } from "@/lib/pagos/fechaLimite";
import { Etiqueta } from "@/components/atoms/Etiqueta";
import type { EstadoPedido, MetodoPago } from "@/types/database";

export const metadata: Metadata = { title: "Mis pedidos — SG Querétaro" };
export const dynamic = "force-dynamic";

const FILTROS_MOVIL: { estado: EstadoPedido | null; label: string }[] = [
  { estado: null, label: "Todos" },
  { estado: "pendiente_pago", label: "Pendiente de pago" },
  // diseño-pagos-stripe.md §5.2: "se agrega 'Pago en proceso' entre
  // 'Pendiente' y 'Comprobante'".
  { estado: "pago_en_proceso", label: "Pago en proceso" },
  { estado: "comprobante_recibido", label: "Comprobante recibido" },
  { estado: "enviado", label: "Enviado" },
  { estado: "entregado", label: "Entregado" },
];

// diseño-pagos-stripe.md §1 (D-P1, violeta) — reemplaza el placeholder que
// reutilizaba el ámbar de pendiente_pago.
const TONO_MOVIL: Record<EstadoPedido, string> = {
  pendiente_pago: "#FFB547",
  pago_en_proceso: "#9085E9",
  comprobante_recibido: "#45E39A",
  listo_envio: "#3CE7FF",
  enviado: "#3CE7FF",
  entregado: "#9FB2C3",
  cancelado: "#FF7A88",
};

const NOMBRE_METODO_CORTO: Partial<Record<MetodoPago, string>> = {
  oxxo: "OXXO",
  spei: "SPEI",
  tarjeta: "Tarjeta",
};

/** diseño-pagos-stripe.md §5.2, botón de acción de la tarjeta cuando el
 * pedido está en `pago_en_proceso`. */
function accionPagoEnProceso(metodo: MetodoPago): string {
  if (metodo === "oxxo") return "Ver ficha de pago";
  if (metodo === "spei") return "Ver datos para transferir";
  return "Completar pago";
}

/** diseño-pagos-stripe.md §5.2, segunda línea bajo la fecha:
 * "OXXO · paga antes del vie 26 sep, 23:59" / "Tarjeta · confirmando con tu
 * banco". */
function subtituloPagoEnProceso(metodo: MetodoPago, expiraEn: string | null): string {
  if (metodo === "tarjeta") return "Tarjeta · confirmando con tu banco";
  const nombre = NOMBRE_METODO_CORTO[metodo] ?? metodo;
  const verbo = metodo === "oxxo" ? "paga antes del" : "transfiere antes del";
  return expiraEn ? `${nombre} · ${verbo} ${formatearFechaLimiteEnFrase(expiraEn)}` : nombre;
}

/** index.html:1218-1252 (`secPedidos`) — C4: lista con folio, fecha, total
 * y estado actual. El bloque móvil (`.cuenta-movil-solo`) traduce
 * literalmente el mockup `Panel_Usuario_Movil.dc.html` (chips de filtro +
 * tarjetas); a diferencia del mockup (filtro por `state` de React), aquí el
 * filtro es un `searchParams` real (`?estado=`) para que cada chip sea un
 * link normal — el escritorio ignora el parámetro y siempre ve todo, como
 * antes. */
export default async function PaginaMisPedidos({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null; // el layout ya redirige; guarda de tipos

  const { estado } = await searchParams;
  const pedidos = await obtenerPedidosDeCliente(sesion.userId);
  const filtroActivo = FILTROS_MOVIL.find((f) => f.estado === estado)?.estado ?? null;
  const pedidosMovil = filtroActivo ? pedidos.filter((o) => o.status === filtroActivo) : pedidos;

  return (
    <div>
      <h1 className="cuenta-escritorio-solo" style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>
        Mis pedidos
      </h1>

      {pedidos.length === 0 ? (
        <p style={{ margin: 0, fontSize: 15.5, color: "var(--text-muted)" }}>
          Todavía no has generado ningún pedido. <Link href="/catalogo" style={{ color: "var(--accent)" }}>Ver catálogo</Link>
        </p>
      ) : (
        <>
          <div className="cuenta-escritorio-solo" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pedidos.map((o) => {
              const enProceso = o.status === "pago_en_proceso" && esMetodoStripe(o.payment_method);
              return (
                <div key={o.id} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 20, display: "flex", gap: 22, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ minWidth: 170 }}>
                    <span className="font-data" style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>{o.folio}</span>
                    <span style={{ display: "block", marginTop: 5, fontSize: 13, color: "var(--text-muted)" }}>
                      {new Date(o.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {enProceso && (
                      <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: "#9FB2C3" }}>
                        {subtituloPagoEnProceso(o.payment_method, o.pagoExpiraEn)}
                      </span>
                    )}
                    <div style={{ marginTop: 8 }}>
                      {enProceso ? (
                        <Etiqueta style={{ border: "1px solid var(--processing)", color: "var(--processing)" }}>
                          <IconoReloj /> Pago en proceso
                        </Etiqueta>
                      ) : (
                        <Etiqueta tono={o.status === "cancelado" ? "peligro" : o.status === "pendiente_pago" ? "advertencia" : "exito"}>
                          {etiquetaEstadoCliente(o.status, o.payment_method)}
                        </Etiqueta>
                      )}
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
                        {enProceso ? accionPagoEnProceso(o.payment_method) : "Ver detalle"}
                      </Link>
                    )}
                    <Link href={`/mi-cuenta/pedidos/${o.folio}`} style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
                      Ver detalle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cuenta-movil-solo">
            <div style={{ display: "flex", gap: 8, overflowX: "auto", margin: "0 -14px 16px", padding: "0 14px" }}>
              {FILTROS_MOVIL.map((f) => {
                const activo = filtroActivo === f.estado;
                const href = f.estado ? `/mi-cuenta/pedidos?estado=${f.estado}` : "/mi-cuenta/pedidos";
                return (
                  <Link
                    key={f.label}
                    href={href}
                    style={{
                      flex: "0 0 auto",
                      minHeight: 36,
                      padding: "8px 13px",
                      whiteSpace: "nowrap",
                      fontSize: 13,
                      border: `1px solid ${activo ? "#3CE7FF" : "#1F3244"}`,
                      color: activo ? "#3CE7FF" : "#9FB2C3",
                    }}
                  >
                    {f.label}
                  </Link>
                );
              })}
            </div>

            {pedidosMovil.length === 0 ? (
              <p style={{ margin: 0, fontSize: 14.5, color: "#9FB2C3" }}>
                {filtroActivo === "pago_en_proceso" ? "No tienes pagos en proceso." : "No hay pedidos con este filtro."}
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {pedidosMovil.map((o) => (
                  <TarjetaPedidoMovil key={o.id} pedido={o} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaPedidoMovil({ pedido: o }: { pedido: PedidoDeLista }) {
  const tono = TONO_MOVIL[o.status];
  const enProceso = o.status === "pago_en_proceso" && esMetodoStripe(o.payment_method);
  const esTransferenciaPendiente = o.status === "pendiente_pago" && o.payment_method === "transferencia";
  const accion = esTransferenciaPendiente
    ? { label: "Subir comprobante", href: `/mi-cuenta/pedidos/${o.folio}/comprobante`, lleno: true }
    : enProceso
      ? { label: accionPagoEnProceso(o.payment_method), href: `/mi-cuenta/pedidos/${o.folio}`, lleno: true }
      : o.status === "entregado"
        ? { label: "Solicitar devolución", href: "/mi-cuenta/devoluciones/nueva", lleno: false }
        : { label: "Rastrear pedido", href: `/mi-cuenta/pedidos/${o.folio}`, lleno: false };

  return (
    <div style={{ border: "1px solid #1F3244", background: "#0F1D2B" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "15px 15px 13px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontFamily: "'IBM Plex Mono',monospace", fontSize: 15.5, color: "#EAF2F8" }}>{o.folio}</span>
          <span style={{ display: "block", marginTop: 4, fontSize: 12.5, color: "#9FB2C3" }}>
            {new Date(o.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {enProceso && (
            <span style={{ display: "block", marginTop: 2, fontSize: 12, color: "#9085E9" }}>{subtituloPagoEnProceso(o.payment_method, o.pagoExpiraEn)}</span>
          )}
          <span style={{ display: "inline-flex", gap: 7, alignItems: "center", marginTop: 9, padding: "5px 10px", border: `1px solid ${tono}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: tono }}>
            {enProceso ? <IconoReloj /> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />}
            {etiquetaEstadoCliente(o.status, o.payment_method)}
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, padding: "0 15px 14px" }}>
        <span>
          <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 21, color: "#EAF2F8" }}>{formatearPrecio(o.total)}</span>
          <span style={{ display: "block", fontSize: 11.5, color: "#7E93A6" }}>IVA incluido</span>
        </span>
        <Link href={`/mi-cuenta/pedidos/${o.folio}`} style={{ padding: "8px 0", fontSize: 13, color: "#9FB2C3" }}>
          Ver detalle
        </Link>
      </div>
      <Link
        href={accion.href}
        style={{
          display: "block",
          width: "100%",
          padding: 15,
          borderTop: `1px solid ${accion.lleno ? "#3CE7FF" : "#1F3244"}`,
          fontFamily: "'Chakra Petch',sans-serif",
          fontWeight: 600,
          fontSize: 15,
          textAlign: "center",
          ...(accion.lleno ? { background: "#3CE7FF", color: "#07111C" } : { color: "#3CE7FF" }),
        }}
      >
        {accion.label}
      </Link>
    </div>
  );
}

/** Ícono de reloj 12px trazo 1.5 (diseño §5.2) — sustituye el punto sólido
 * del chip cuando el estado es "Pago en proceso". */
function IconoReloj() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}
