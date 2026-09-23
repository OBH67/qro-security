import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerDetallePedidoAdmin } from "@/server/db/queries/admin/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { AccionesPedido } from "@/components/organisms/admin/AccionesPedido";
import type { EstadoPedido } from "@/types/database";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ folio: string }> }): Promise<Metadata> {
  const { folio } = await params;
  return { title: `${folio} — Panel SG Querétaro` };
}

const ESTILO_ESTADO: Record<EstadoPedido, React.CSSProperties> = {
  pendiente_pago: { background: "transparent", border: "1px solid var(--warning)", color: "var(--warning)" },
  comprobante_recibido: { background: "var(--accent)", color: "#07111C" },
  listo_envio: { background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)" },
  enviado: { background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)" },
  entregado: { background: "transparent", border: "1px solid var(--success)", color: "var(--success)" },
  cancelado: { background: "transparent", border: "1px solid var(--danger-text)", color: "var(--danger-text)" },
};
const ETIQUETA_ESTADO: Record<EstadoPedido, string> = {
  pendiente_pago: "Pendiente de pago",
  comprobante_recibido: "Comprobante recibido",
  listo_envio: "Listo para envío",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};
const PASOS_HISTORIAL: { estado: EstadoPedido; label: string }[] = [
  { estado: "pendiente_pago", label: "Pedido generado" },
  { estado: "comprobante_recibido", label: "Comprobante recibido" },
  { estado: "listo_envio", label: "Listo para envío" },
  { estado: "enviado", label: "Enviado" },
  { estado: "entregado", label: "Entregado" },
];
const PASO_CANCELADO: { estado: EstadoPedido; label: string } = { estado: "cancelado", label: "Cancelado" };

/** panel-admin-maqueta.html:377-508 — dos variantes de la misma pantalla
 * (detalle normal con comprobante, y RN-11 pagado con saldo al 100%),
 * unificadas aquí por una sola condición: `payment_method`. */
export default async function PaginaDetallePedidoAdmin({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const detalle = await obtenerDetallePedidoAdmin(folio);
  if (!detalle) notFound();

  const { pedido, items, comprobante, historial, cliente, movimientosSaldo, saldoDisponibleCliente } = detalle;
  const esRN11 = pedido.payment_method === "saldo_completo";
  const direccion = pedido.shipping_address;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <Link href="/admin/pedidos" style={{ fontSize: 13 }}>
          ‹ Pedidos
        </Link>
        <span style={{ color: "var(--border-strong)" }}>·</span>
        <h1 className="title mono" style={{ fontSize: 22, margin: 0 }}>
          {pedido.folio}
        </h1>
        <span className="badge" style={{ ...ESTILO_ESTADO[pedido.status], marginLeft: "auto" }}>
          {ETIQUETA_ESTADO[pedido.status]}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
        {esRN11 ? (
          <div className="tarjeta" style={{ padding: 18, height: "fit-content" }}>
            <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 15, margin: "0 0 8px" }}>Pagado con saldo a favor</h3>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 16 }}>
              Este pedido no tiene comprobante porque el saldo a favor del cliente cubrió el 100% del importe. Aun así requiere tu confirmación.
            </div>
            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Movimientos de saldo del cliente
            </div>
            <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", padding: 12 }}>
              {movimientosSaldo.slice(0, 5).map((m, i) => (
                <div
                  key={i}
                  style={{ display: "flex", justifyContent: "space-between", fontSize: 13, paddingBottom: 8, marginBottom: i < 4 ? 8 : 0, borderBottom: i < Math.min(4, movimientosSaldo.length - 1) ? "1px solid var(--border-subtle)" : "none" }}
                >
                  <div>{m.descripcion}</div>
                  <div className="mono" style={{ color: Number(m.monto) >= 0 ? "var(--success)" : "var(--text-secondary)" }}>
                    {Number(m.monto) >= 0 ? "+" : "−"}
                    {formatearPrecio(Math.abs(Number(m.monto)))}
                  </div>
                </div>
              ))}
              {movimientosSaldo.length === 0 && <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Sin movimientos.</div>}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="tarjeta" style={{ padding: 18 }}>
              <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 10px" }}>Comprobante de pago</h3>
              {comprobante ? (
                <>
                  <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", height: 420, position: "relative", overflow: "hidden" }}>
                    <Image src={comprobante.urlLectura} alt="Comprobante de pago" fill style={{ objectFit: "contain" }} unoptimized />
                  </div>
                  <a href={comprobante.urlLectura} target="_blank" rel="noopener noreferrer" className="btn btn-fantasma btn-sm" style={{ marginTop: 10 }}>
                    ↓ Ver / descargar original
                  </a>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
                    Subido {new Date(comprobante.uploaded_at).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </>
              ) : (
                <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontSize: 13 }}>
                  Sin comprobante subido todavía.
                </div>
              )}
            </div>
            <div className="tarjeta" style={{ padding: 18 }}>
              <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 10px" }}>Productos del pedido</h3>
              {items.map((it) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <div>
                    <div style={{ fontSize: 14 }}>{it.name}</div>
                    <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {it.sku} · {it.qty} × {formatearPrecio(it.unit_price)} · Disponible: {it.disponible} pzas
                    </div>
                  </div>
                  <div className="mono">{formatearPrecio(it.subtotal)}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
                <span>Subtotal</span>
                <span className="mono">{formatearPrecio(pedido.subtotal)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-muted)" }}>
                <span>Saldo aplicado</span>
                <span className="mono">−{formatearPrecio(pedido.credit_applied)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 6, borderTop: "1px solid var(--border)", fontSize: 15, fontWeight: 500 }}>
                <span>Total a transferir</span>
                <span className="mono">{formatearPrecio(pedido.total)}</span>
              </div>
            </div>
            <div className="tarjeta" style={{ padding: 18 }}>
              <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 13, letterSpacing: 0.5, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 10px" }}>Historial</h3>
              {(pedido.status === "cancelado" ? [...PASOS_HISTORIAL, PASO_CANCELADO] : PASOS_HISTORIAL).map((paso) => {
                const evento = historial.find((h) => h.to_status === paso.estado);
                const esCancelado = paso.estado === "cancelado";
                return (
                  <div key={paso.estado} style={{ display: "flex", gap: 10, fontSize: 13, marginBottom: 8, color: evento ? "var(--text-primary)" : "var(--text-dim)" }}>
                    <span style={{ color: evento ? (esCancelado ? "var(--danger-text)" : "var(--accent)") : "var(--text-dim)" }}>{evento ? "●" : "○"}</span>
                    <span>{paso.label}</span>
                    {evento && (
                      <span className="mono" style={{ color: "var(--text-muted)", marginLeft: "auto" }}>
                        {new Date(evento.changed_at).toLocaleString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="tarjeta" style={{ padding: 18 }}>
            {esRN11 ? (
              <>
                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "var(--font-title)", fontWeight: 600 }}>Importe del pedido</div>
                <div className="mono" style={{ fontSize: 30, fontWeight: 500, margin: "4px 0 14px" }}>
                  {formatearPrecio(pedido.subtotal)}
                </div>
                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "var(--font-title)", fontWeight: 600 }}>Saldo aplicado</div>
                  <div className="mono" style={{ fontSize: 30, fontWeight: 500, margin: "4px 0 8px" }}>
                    −{formatearPrecio(pedido.credit_applied)}
                  </div>
                  <div style={{ color: "var(--success)", fontSize: 13 }}>✓ El saldo cubre el total</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, marginTop: 14, borderTop: "1px solid var(--border)", fontSize: 15, fontWeight: 500 }}>
                  <span>A transferir</span>
                  <span className="mono">{formatearPrecio(pedido.total)}</span>
                </div>
                <dl style={{ margin: "16px 0 0", fontSize: 13, display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                  <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>Saldo del cliente</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <dt style={{ color: "var(--text-primary)" }}>Disponible ahora</dt>
                    <dd className="mono" style={{ margin: 0 }}>
                      {formatearPrecio(saldoDisponibleCliente)}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "var(--font-title)", fontWeight: 600 }}>Importe esperado</div>
                <div className="mono" style={{ fontSize: 30, fontWeight: 500, margin: "4px 0 14px" }}>
                  {formatearPrecio(pedido.total)}
                </div>
                {comprobante && (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14 }}>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "var(--font-title)", fontWeight: 600 }}>Declarado por el cliente</div>
                    <div className="mono" style={{ fontSize: 30, fontWeight: 500, margin: "4px 0 8px" }}>
                      {formatearPrecio(comprobante.amount)}
                    </div>
                    {Number(comprobante.amount) === Number(pedido.total) ? (
                      <div style={{ color: "var(--success)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>✓ Los montos coinciden</div>
                    ) : (
                      <div style={{ color: "var(--warning)", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>⚠ Los montos no coinciden</div>
                    )}
                    <dl style={{ margin: "16px 0 0", fontSize: 13, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <dt style={{ color: "var(--text-muted)" }}>Fecha transferencia</dt>
                        <dd className="mono" style={{ margin: 0 }}>
                          {new Date(comprobante.transfer_date).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}
                        </dd>
                      </div>
                      {comprobante.origin_bank && (
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <dt style={{ color: "var(--text-muted)" }}>Banco de origen</dt>
                          <dd className="mono" style={{ margin: 0 }}>
                            {comprobante.origin_bank}
                          </dd>
                        </div>
                      )}
                      {comprobante.spei_tracking_key && (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <dt style={{ color: "var(--text-muted)" }}>Clave SPEI</dt>
                          <dd className="mono" style={{ margin: 0, fontSize: 11 }}>
                            {comprobante.spei_tracking_key}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
              </>
            )}
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14, fontSize: 13 }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Cliente</div>
              {cliente ? (
                <>
                  <div>
                    {cliente.first_name} {cliente.last_name}
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {cliente.email} · {cliente.phone}
                  </div>
                  {!cliente.email_verified && <div style={{ color: "var(--warning)", fontSize: 12, marginTop: 4 }}>⚠ Correo sin verificar</div>}
                </>
              ) : (
                <div style={{ color: "var(--text-muted)" }}>Cliente no encontrado.</div>
              )}
            </div>
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14, fontSize: 13 }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Envío</div>
              <div>
                {direccion.street} {direccion.ext_number}
                {direccion.int_number ? `, Int. ${direccion.int_number}` : ""}
              </div>
              <div>
                Col. {direccion.neighborhood}, C.P. {direccion.postal_code}, {direccion.municipality}, {direccion.state}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>Recibe: {direccion.recipient_name}</div>
            </div>
            <div style={{ borderTop: "1px solid var(--border)", marginTop: 14, paddingTop: 14, fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>Factura</span> {pedido.wants_invoice ? `Sí · RFC ${pedido.billing_data?.rfc ?? "—"}` : "No"}
            </div>
          </div>
          <AccionesPedido orderId={pedido.id} folio={pedido.folio} status={pedido.status} />
        </div>
      </div>
    </div>
  );
}
