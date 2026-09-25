import Link from "next/link";
import type { Metadata } from "next";
import {
  obtenerTarjetasAtencion,
  obtenerKpisTablero,
  obtenerVentasPorDia,
  obtenerEmbudo,
  obtenerMasVendidos,
  obtenerImportePorGrupo,
  obtenerSaldoYDevoluciones,
  obtenerStockCritico,
  type PeriodoTablero,
} from "@/server/db/queries/admin/tablero";
import { formatearPrecio } from "@/lib/formato";
import { construirPuntosSvg } from "@/lib/svg";

export const metadata: Metadata = { title: "Inicio — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

const PERIODOS: { valor: PeriodoTablero; label: string }[] = [
  { valor: "7", label: "7 días" },
  { valor: "30", label: "30 días" },
  { valor: "mes", label: "Este mes" },
];

const ETIQUETA_ESTADO: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  // Épica P: se agrega al embudo ("¿Dónde están mis pedidos?") — es un
  // tramo real para pedidos con Stripe, aunque RN-15 diga que no requiere
  // acción del admin (por eso no está entre las tarjetas de atención de
  // arriba, solo aquí como foto informativa).
  pago_en_proceso: "Pago en proceso",
  comprobante_recibido: "Comprobante recibido",
  listo_envio: "Listo para envío",
  enviado: "Enviado",
};
// diseño-pagos-stripe.md §1 (D-P1, violeta `--processing` = #9085E9).
const COLOR_ETAPA: Record<string, string> = {
  pendiente_pago: "#176F7B",
  pago_en_proceso: "#9085E9",
  comprobante_recibido: "#1E93A3",
  listo_envio: "#26B8CC",
  enviado: "#3CE7FF",
};
const HREF_ETAPA: Record<string, string> = {
  pendiente_pago: "/admin/pedidos?estado=pendiente_pago",
  pago_en_proceso: "/admin/pedidos?estado=pago_en_proceso",
  comprobante_recibido: "/admin/pedidos?estado=comprobante_recibido",
  listo_envio: "/admin/pedidos?estado=listo_envio",
  enviado: "/admin/pedidos?estado=enviado",
};
const COLOR_GRUPO = ["#3987E5", "#D95926", "#199E70", "#C98500", "#D55181", "#008300", "#9085E9", "#E66767"];

function deltaTexto(pct: number | null): { texto: string; color: string } {
  if (pct === null) return { texto: "—", color: "var(--text-muted)" };
  const positivo = pct >= 0;
  return { texto: `${positivo ? "▲" : "▼"} ${Math.abs(pct)}%`, color: positivo ? "var(--success)" : "var(--danger-text)" };
}

/** panel-admin-maqueta.html:172-330 (`isTablero`) — traducción literal,
 * con datos reales de la base (G2, H6): las tarjetas y el embudo son
 * fotos del momento; KPIs, gráfica de ventas, más vendidos, por grupo y
 * tasa de devoluciones respetan el periodo elegido (G2.3). Los deltas
 * "▲/▼ N%" comparan contra el periodo inmediato anterior de igual
 * longitud. */
export default async function PaginaTableroAdmin({ searchParams }: { searchParams: Promise<{ periodo?: string }> }) {
  const sp = await searchParams;
  const periodo: PeriodoTablero = sp.periodo === "7" || sp.periodo === "mes" ? sp.periodo : "30";
  const periodoLabel = PERIODOS.find((p) => p.valor === periodo)?.label ?? "30 días";

  const [atencion, kpis, ventasPorDia, embudo, masVendidos, porGrupo, saldoDev, stockCritico] = await Promise.all([
    obtenerTarjetasAtencion(),
    obtenerKpisTablero(periodo),
    obtenerVentasPorDia(periodo),
    obtenerEmbudo(),
    obtenerMasVendidos(periodo, 5),
    obtenerImportePorGrupo(periodo),
    obtenerSaldoYDevoluciones(periodo),
    obtenerStockCritico(4),
  ]);

  const tarjetas = [
    { cifra: atencion.comprobantesPorValidar, etiqueta: "COMPROBANTES POR VALIDAR", accion: "Revisar →", tipo: "urgente" as const, href: "/admin/pedidos?estado=comprobante_recibido" },
    { cifra: atencion.pedidosPorEnviar, etiqueta: "PEDIDOS POR ENVIAR", accion: "Ver →", tipo: "cian" as const, href: "/admin/pedidos?estado=listo_envio" },
    { cifra: atencion.devolucionesPendientes, etiqueta: "DEVOLUCIONES POR RESOLVER", accion: "Resolver →", tipo: "ambar" as const, href: "/admin/devoluciones" },
    { cifra: atencion.solicitudesSinContactar, etiqueta: "SOLICITUDES SIN CONTACTAR", accion: "Contactar →", tipo: "ambar" as const, href: "/admin/solicitudes" },
    { cifra: atencion.pedidosPorVencer, etiqueta: "PEDIDOS POR VENCER", accion: "Ver →", tipo: "rojo" as const, href: "/admin/pedidos?estado=pendiente_pago" },
    { cifra: atencion.productosAgotados, etiqueta: "PRODUCTOS AGOTADOS", accion: "Ver →", tipo: "ambar" as const, href: "/admin/catalogo?sinStock=1" },
  ];
  const estiloPorTipo = {
    urgente: { tarjeta: "padding:16px;background:var(--accent);border-color:var(--accent)", cifra: { fontSize: 28, fontWeight: 500, color: "#07111C" }, etq: "#07111C", acc: "#07111C" },
    cian: { tarjeta: "padding:16px", cifra: { fontSize: 28, fontWeight: 500, color: "var(--accent)" }, etq: "var(--text-muted)", acc: "var(--accent)" },
    ambar: { tarjeta: "padding:16px;border-color:var(--warning)", cifra: { fontSize: 28, fontWeight: 500, color: "var(--warning)" }, etq: "var(--text-muted)", acc: "var(--warning)" },
    rojo: { tarjeta: "padding:16px;border-color:var(--danger)", cifra: { fontSize: 28, fontWeight: 500, color: "var(--danger-text)" }, etq: "var(--text-muted)", acc: "var(--danger-text)" },
  };

  const maxVentas = Math.max(1, ...ventasPorDia.map((p) => Math.max(p.actual, p.anterior)));
  const puntosActual = construirPuntosSvg(ventasPorDia.map((p) => p.actual), 560, 160, maxVentas);
  const puntosAnterior = construirPuntosSvg(ventasPorDia.map((p) => p.anterior), 560, 160, maxVentas);
  const areaActual = ventasPorDia.length > 1 ? `0,160 ${puntosActual} 560,160` : "";
  const totalVentasPeriodo = ventasPorDia.reduce((s, p) => s + p.actual, 0);
  const diaMax = ventasPorDia.reduce((max, p, i) => (p.actual > (ventasPorDia[max]?.actual ?? -1) ? i : max), 0);
  const stepX = ventasPorDia.length > 1 ? 560 / (ventasPorDia.length - 1) : 0;

  const maxEmbudo = Math.max(1, ...embudo.map((e) => e.cifra));
  const maxMasVendidos = Math.max(1, ...masVendidos.map((m) => m.unidades));
  const totalGrupo = Math.max(1, porGrupo.reduce((s, g) => s + g.importe, 0));

  const kpisMostrar = [
    { valor: formatearPrecio(kpis.ventas), etiqueta: "Ventas", delta: deltaTexto(kpis.ventasDeltaPct) },
    { valor: String(kpis.pedidos), etiqueta: "Pedidos", delta: deltaTexto(kpis.pedidosDeltaPct) },
    { valor: formatearPrecio(kpis.ticketPromedio), etiqueta: "Ticket promedio", delta: deltaTexto(kpis.ticketDeltaPct) },
    { valor: `${Math.round(kpis.tasaSePagan)}%`, etiqueta: "Se pagan", delta: deltaTexto(kpis.tasaSePaganDeltaPct) },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 className="title" style={{ fontSize: 28, margin: 0 }}>
            Inicio
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }} role="group" aria-label="Periodo">
          {PERIODOS.map((p) => (
            <Link key={p.valor} href={`/admin?periodo=${p.valor}`} className={`chip${p.valor === periodo ? " activo" : ""}`}>
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 14, letterSpacing: 1, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>
        Lo que necesita tu atención hoy
      </h2>
      <div className="admin-grid-atencion" style={{ gap: 12, marginBottom: 32 }}>
        {tarjetas.map((t) => {
          const st = estiloPorTipo[t.tipo];
          return (
            <Link key={t.etiqueta} href={t.href} className="tarjeta cut cut-10" style={{ ...cssStyle(st.tarjeta) }} aria-label={`${t.cifra} ${t.etiqueta.toLowerCase()}`}>
              <div className="mono" style={st.cifra}>
                {t.cifra}
              </div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, letterSpacing: 0.5, color: st.etq, lineHeight: 1.3, marginTop: 2 }}>{t.etiqueta}</div>
              <div style={{ fontSize: 12, color: st.acc, marginTop: 6 }}>{t.accion}</div>
            </Link>
          );
        })}
      </div>

      <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 14, letterSpacing: 1, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 12px" }}>
        Cómo va el negocio · {periodoLabel}
      </h2>
      <div className="admin-grid-kpis" style={{ gap: 12, marginBottom: 16 }}>
        {kpisMostrar.map((k) => (
          <div key={k.etiqueta} className="tarjeta" style={{ padding: 18 }}>
            <div className="mono" style={{ fontSize: 28, fontWeight: 500 }}>
              {k.valor}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-title)", fontWeight: 500, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 2 }}>{k.etiqueta}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: k.delta.color, fontFamily: "var(--font-mono)" }}>{k.delta.texto}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--accent-tint)", border: "1px solid var(--border)", padding: "8px 14px", marginBottom: 20 }}>
        ⓘ Los KPI cuentan solo pedidos con pago validado (Listo para envío en adelante), no pedidos pendientes.
      </div>

      <div className="admin-grid-2-ancho" style={{ gap: 16, marginBottom: 20 }}>
        <div className="tarjeta" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: 0 }}>Ventas por día</h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>¿Cómo va este periodo contra el anterior?</div>
          {ventasPorDia.length === 0 || totalVentasPeriodo === 0 ? (
            <EstadoVacioGrafica texto="Todavía no hay ventas con pago validado en este periodo." />
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
                <span>
                  <span style={{ display: "inline-block", width: 16, height: 2, background: "var(--accent)", verticalAlign: "middle", marginRight: 6 }} />
                  Este periodo
                </span>
                <span>
                  <span style={{ display: "inline-block", width: 16, height: 2, background: "var(--text-dim)", verticalAlign: "middle", marginRight: 6, borderTop: "2px dashed var(--text-dim)" }} />
                  Periodo anterior
                </span>
              </div>
              <svg viewBox="0 0 560 190" style={{ width: "100%", height: 220 }} role="img" aria-label={`Ventas por día. Total del periodo ${formatearPrecio(totalVentasPeriodo)}.`}>
                {[40, 80, 120, 160].map((y) => (
                  <line key={y} x1="0" y1={y} x2="560" y2={y} stroke="var(--track)" strokeWidth="1" />
                ))}
                <polyline points={puntosAnterior} fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeDasharray="4,4" />
                <polyline points={puntosActual} fill="none" stroke="var(--accent)" strokeWidth="2" />
                <polygon points={areaActual} fill="url(#gradVentas)" opacity=".22" />
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity=".8" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {ventasPorDia[diaMax] && (
                  <>
                    <circle cx={diaMax * stepX} cy={160 - (ventasPorDia[diaMax].actual / maxVentas) * 160} r="4" fill="var(--accent)" />
                    <text x={diaMax * stepX} y={160 - (ventasPorDia[diaMax].actual / maxVentas) * 160 - 10} className="mono" fontSize="11" fill="var(--text-primary)" textAnchor="middle">
                      {formatearPrecio(ventasPorDia[diaMax].actual)}
                    </text>
                  </>
                )}
                <text x="536" y="172" className="mono" fontSize="11" fill="var(--text-muted)" textAnchor="end">
                  {formatearFechaCorta(ventasPorDia[0]?.fecha)}
                </text>
                <text x="24" y="172" className="mono" fontSize="11" fill="var(--text-muted)" textAnchor="start">
                  {formatearFechaCorta(ventasPorDia[ventasPorDia.length - 1]?.fecha)}
                </text>
              </svg>
              <details style={{ marginTop: 6 }}>
                <summary style={{ fontSize: 13, color: "var(--accent)", cursor: "pointer" }}>Ver los datos</summary>
                <table style={{ marginTop: 10 }}>
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Este periodo</th>
                      <th>Periodo anterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventasPorDia.map((p) => (
                      <tr key={p.fecha}>
                        <td className="mono">{formatearFechaCorta(p.fecha)}</td>
                        <td className="mono">{formatearPrecio(p.actual)}</td>
                        <td className="mono">{formatearPrecio(p.anterior)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            </>
          )}
        </div>

        <div className="tarjeta" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: 0 }}>¿Dónde están mis pedidos?</h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Pedidos abiertos ahora mismo (foto del momento, no depende del periodo)</div>
          {embudo.every((e) => e.cifra === 0) ? (
            <EstadoVacioGrafica texto="Todavía no hay pedidos abiertos." />
          ) : (
            embudo.map((e) => (
              <Link key={e.estado} href={HREF_ETAPA[e.estado]} style={{ display: "block", marginBottom: 14, textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
                  <span>{ETIQUETA_ESTADO[e.estado]}</span>
                  <span className="mono" style={{ color: "var(--text-primary)" }}>
                    {e.cifra}
                  </span>
                </div>
                <div style={{ background: "var(--track)", height: 10, width: "100%" }}>
                  <div style={{ height: "100%", width: `${(e.cifra / maxEmbudo) * 100}%`, background: COLOR_ETAPA[e.estado] }} />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      <div className="admin-grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <div className="tarjeta" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: 0 }}>Más vendidos</h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>¿Qué debo reabastecer?</div>
          {masVendidos.length === 0 ? (
            <EstadoVacioGrafica texto="Todavía no hay ventas con pago validado en este periodo." />
          ) : (
            <>
              {masVendidos.map((m) => (
                <div key={m.sku} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "var(--text-secondary)" }}>
                      {m.nombre} <span className="mono" style={{ color: "var(--text-dim)", fontSize: 11 }}>{m.sku}</span>
                    </span>
                    <span className="mono" style={{ color: "var(--text-primary)" }}>
                      {m.unidades}
                    </span>
                  </div>
                  <div style={{ background: "var(--track)", height: 8, width: "100%" }}>
                    <div style={{ height: "100%", width: `${(m.unidades / maxMasVendidos) * 100}%`, background: "var(--accent)" }} />
                  </div>
                </div>
              ))}
              <Link href="/admin/analitica" style={{ fontSize: 13 }}>
                Ver los 10 · Analítica
              </Link>
            </>
          )}
        </div>

        <div className="tarjeta" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: 0 }}>Se te va a acabar</h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Productos con 3 piezas o menos</div>
          {stockCritico.length === 0 ? (
            <EstadoVacioGrafica texto="Ningún producto activo está por agotarse." />
          ) : (
            <>
              {stockCritico.map((p) => (
                <Link
                  key={p.sku}
                  href="/admin/catalogo"
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border-subtle)", textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {p.sku}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.nombre}</div>
                  </div>
                  <span className="badge" style={{ background: "transparent", border: `1px solid ${p.disponible === 0 ? "var(--danger-text)" : "var(--warning)"}`, color: p.disponible === 0 ? "var(--danger-text)" : "var(--warning)" }}>
                    {p.disponible === 0 ? "Agotado" : `Últimas ${p.disponible}`}
                  </span>
                </Link>
              ))}
              <Link href="/admin/catalogo" style={{ fontSize: 13, display: "block", marginTop: 10 }}>
                Ver todos en Catálogo
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="tarjeta" style={{ padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: 0 }}>¿De qué vive el negocio?</h3>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>Importe validado por grupo · {periodoLabel}</div>
        {porGrupo.length === 0 ? (
          <EstadoVacioGrafica texto="Todavía no hay ventas con pago validado en este periodo." />
        ) : (
          <>
            <div style={{ display: "flex", width: "100%", height: 28, overflow: "hidden" }}>
              {porGrupo.map((g, i) => (
                <div key={g.nombre} style={{ width: `${(g.importe / totalGrupo) * 100}%`, background: COLOR_GRUPO[i % COLOR_GRUPO.length], marginRight: 2, height: "100%" }} title={`${g.nombre} ${Math.round((g.importe / totalGrupo) * 100)}%`} />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 14 }}>
              {porGrupo.map((g, i) => (
                <div key={g.nombre} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--text-secondary)" }}>
                  <span style={{ width: 10, height: 10, background: COLOR_GRUPO[i % COLOR_GRUPO.length], display: "inline-block", borderRadius: 2 }} />
                  {g.nombre} <span className="mono" style={{ color: "var(--text-primary)" }}>{Math.round((g.importe / totalGrupo) * 100)}%</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="admin-grid-2" style={{ gap: 16, marginBottom: 20 }}>
        <div className="tarjeta" style={{ padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, margin: 0 }}>Saldo a favor comprometido</h3>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>Dinero que ya debes en mercancía</div>
          <div className="mono" style={{ fontSize: 40, fontWeight: 500 }}>
            {formatearPrecio(saldoDev.saldoComprometido)}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>de {saldoDev.clientesConSaldo} clientes</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
            <span style={{ color: "var(--text-secondary)" }}>Tasa de devoluciones · {periodoLabel}</span>
            <span className="mono" style={{ color: "var(--success)" }}>{saldoDev.tasaDevolucionesPct.toFixed(1)}%</span>
          </div>
          <div style={{ background: "var(--track)", height: 10, width: "100%" }}>
            <div style={{ height: "100%", width: `${Math.min(100, saldoDev.tasaDevolucionesPct)}%`, background: "var(--success)" }} />
          </div>
        </div>
        <div className="tarjeta" style={{ padding: 20, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: 8 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
            El resto de la analítica (más y menos vendidos filtrable, exportable a CSV) vive en su propia pantalla.
          </div>
          <Link href="/admin/analitica" className="btn btn-secundario cut cut-10">
            Ir a Analítica
          </Link>
        </div>
      </div>
    </div>
  );
}

function EstadoVacioGrafica({ texto }: { texto: string }) {
  return (
    <div style={{ padding: "36px 12px", textAlign: "center", color: "var(--text-dim)", fontSize: 13, border: "1px dashed var(--border)", background: "var(--bg-inset)" }}>{texto}</div>
  );
}

function formatearFechaCorta(iso: string | undefined): string {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function cssStyle(inline: string): React.CSSProperties {
  const props: Record<string, string> = {};
  for (const decl of inline.split(";")) {
    const [k, v] = decl.split(":");
    if (!k || !v) continue;
    const camel = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    props[camel] = v.trim();
  }
  return props as React.CSSProperties;
}
