import Link from "next/link";
import type { Metadata } from "next";
import { obtenerPedidosAdmin, obtenerConteosPedidosPorEstado } from "@/server/db/queries/admin/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { ChipMetodoPago } from "@/components/atoms/ChipMetodoPago";
import type { EstadoPedido } from "@/types/database";

export const metadata: Metadata = { title: "Pedidos — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

const ESTADOS: { valor: EstadoPedido | "todos"; label: string }[] = [
  { valor: "todos", label: "Todos" },
  { valor: "pendiente_pago", label: "Pendiente de pago" },
  { valor: "pago_en_proceso", label: "Pago en proceso" },
  { valor: "comprobante_recibido", label: "Comprobante recibido" },
  { valor: "listo_envio", label: "Listo para envío" },
  { valor: "enviado", label: "Enviado" },
  { valor: "entregado", label: "Entregado" },
  { valor: "cancelado", label: "Cancelado" },
];

// diseño-pagos-stripe.md §1 (D-P1, violeta `--processing`, aprobado):
// reemplaza el placeholder que reutilizaba el ámbar de pendiente_pago. El
// chip de método (OXXO/SPEI/Tarjeta) y el resto de la bandeja de revisión
// (§6.1/§6.2) son la siguiente tarea, no esta.
const ESTILO_ESTADO: Record<EstadoPedido, { label: string; estilo: React.CSSProperties }> = {
  pendiente_pago: { label: "Pendiente de pago", estilo: { background: "transparent", border: "1px solid var(--warning)", color: "var(--warning)" } },
  pago_en_proceso: { label: "Pago en proceso", estilo: { background: "transparent", border: "1px solid var(--processing)", color: "var(--processing)" } },
  comprobante_recibido: { label: "Comprobante recibido", estilo: { background: "var(--accent)", color: "#07111C" } },
  listo_envio: { label: "Listo para envío", estilo: { background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)" } },
  enviado: { label: "Enviado", estilo: { background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)" } },
  entregado: { label: "Entregado", estilo: { background: "transparent", border: "1px solid var(--success)", color: "var(--success)" } },
  cancelado: { label: "Cancelado", estilo: { background: "transparent", border: "1px solid var(--danger-text)", color: "var(--danger-text)" } },
};

/** panel-admin-maqueta.html:333-375 (`isPedidos`) — traducción literal,
 * con datos reales. C5.1: filtrable por estado, buscable por folio,
 * cliente o correo. */
export default async function PaginaPedidosAdmin({ searchParams }: { searchParams: Promise<{ estado?: string; q?: string }> }) {
  const sp = await searchParams;
  const estado = ESTADOS.find((e) => e.valor === sp.estado)?.valor as EstadoPedido | "todos" | undefined;
  const busqueda = sp.q ?? "";

  const [pedidos, conteos] = await Promise.all([
    obtenerPedidosAdmin({ estado: estado && estado !== "todos" ? estado : undefined, busqueda }),
    obtenerConteosPedidosPorEstado(),
  ]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 className="title" style={{ fontSize: 28, margin: 0 }}>
          Pedidos
        </h1>
        <a href={`/api/admin/pedidos/exportar${estado && estado !== "todos" ? `?estado=${estado}` : ""}`} className="btn btn-fantasma cut cut-10">
          Exportar CSV
        </a>
      </div>

      <form method="get" style={{ marginBottom: 14 }}>
        {estado && <input type="hidden" name="estado" value={estado} />}
        <input className="campo" style={{ maxWidth: 340 }} name="q" defaultValue={busqueda} placeholder="🔍 Folio, cliente o correo" />
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }} role="group" aria-label="Filtro por estado">
        {ESTADOS.map((e) => {
          const esPagoEnProceso = e.valor === "pago_en_proceso";
          const mostrarPulsoComprobante = e.valor === "comprobante_recibido" && conteos.comprobante_recibido > 0 && (estado ?? "todos") !== e.valor;
          return (
            <Link
              key={e.valor}
              href={`/admin/pedidos${e.valor === "todos" ? "" : `?estado=${e.valor}`}`}
              className={`chip${(estado ?? "todos") === e.valor ? " activo" : ""}`}
            >
              {mostrarPulsoComprobante && (
                <span className="sg-pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--warning)", marginRight: 6 }} />
              )}
              {/* §6.1: punto violeta SIN pulso y SIN contador — no es
                  trabajo del admin resolverlo (RN-15), solo sirve para
                  consultar. */}
              {esPagoEnProceso && (
                <span aria-hidden="true" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--processing)", marginRight: 6 }} />
              )}
              {e.label}
              {!esPagoEnProceso && ` ${conteos[e.valor as keyof typeof conteos]}`}
            </Link>
          );
        })}
      </div>

      <div className="tarjeta">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Prods.</th>
              <th>Total</th>
              <th>Método</th>
              <th>Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((p) => {
              const est = ESTILO_ESTADO[p.status];
              const textoBandera = p.banderaRevision === "monto_distinto" ? "Monto distinto" : p.banderaRevision === "pagado_sin_inventario" ? "Pagado sin inventario" : null;
              return (
                <tr key={p.id} className="fila" style={{ cursor: "pointer" }}>
                  <td className="mono">
                    <Link href={`/admin/pedidos/${p.folio}`} style={{ color: "inherit", display: "block" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {textoBandera && (
                          <span aria-hidden="true" style={{ color: "var(--warning)" }} title={textoBandera}>
                            ⚠
                          </span>
                        )}
                        {p.folio}
                      </span>
                      {textoBandera && <div style={{ fontSize: 11, color: "var(--warning)", fontFamily: "var(--font-body)" }}>{textoBandera}</div>}
                    </Link>
                  </td>
                  <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(p.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td>
                    {p.cliente}
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.correo}</div>
                  </td>
                  <td className="mono">{p.prods}</td>
                  <td className="mono">{formatearPrecio(p.total)}</td>
                  <td>
                    <ChipMetodoPago metodo={p.metodo} />
                  </td>
                  <td className="mono" style={{ color: Number(p.creditApplied) === 0 ? "var(--text-muted)" : "var(--success)" }}>
                    {Number(p.creditApplied) === 0 ? "—" : `−${formatearPrecio(p.creditApplied)}`}
                  </td>
                  <td>
                    <span className="badge" style={est.estilo}>
                      {est.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {pedidos.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                  No hay pedidos que coincidan con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, fontSize: 13, color: "var(--text-muted)" }}>
        <span>Mostrando {pedidos.length} de {conteos.todos}</span>
      </div>
    </div>
  );
}
