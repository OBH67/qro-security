import type { Metadata } from "next";
import { obtenerAnaliticaAdmin, obtenerFiltrosCategoria, huboAlgunaVentaValidada, type OrdenRanking } from "@/server/db/queries/admin/analitica";
import { FiltrosAnalitica, type PeriodoAnalitica } from "@/components/organisms/admin/FiltrosAnalitica";
import { RankingProductos } from "@/components/organisms/admin/RankingProductos";
import { formatearPrecio } from "@/lib/formato";

export const metadata: Metadata = { title: "Analítica — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

function rangoDelPeriodo(periodo: PeriodoAnalitica, desdeQuery: string, hastaQuery: string): { desde: string; hasta: string; rangoInvalido: boolean } {
  const ahora = new Date();
  if (periodo === "personalizado" && desdeQuery && hastaQuery) {
    const desde = new Date(`${desdeQuery}T00:00:00`);
    const hasta = new Date(`${hastaQuery}T00:00:00`);
    hasta.setDate(hasta.getDate() + 1); // el filtro es exclusivo en `hasta`
    if (desde >= hasta) return { desde: desdeQuery, hasta: hastaQuery, rangoInvalido: true };
    return { desde: desde.toISOString(), hasta: hasta.toISOString(), rangoInvalido: false };
  }
  if (periodo === "mes") {
    const desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    return { desde: desde.toISOString(), hasta: new Date().toISOString(), rangoInvalido: false };
  }
  const dias = periodo === "7" ? 7 : 30;
  const desde = new Date(ahora.getTime() - dias * 86_400_000);
  return { desde: desde.toISOString(), hasta: new Date().toISOString(), rangoInvalido: false };
}

/** panel-admin-maqueta.html:913-956 / diseño.md §11.12 — traducción
 * literal. G1: reutiliza el mismo criterio de "pago validado" del
 * tablero. */
export default async function PaginaAnaliticaAdmin({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; desde?: string; hasta?: string; grupo?: string; subcategoria?: string; orden?: string }>;
}) {
  const sp = await searchParams;
  const periodo = (["7", "30", "mes", "personalizado"] as const).includes(sp.periodo as PeriodoAnalitica) ? (sp.periodo as PeriodoAnalitica) : "30";
  const desdeQuery = sp.desde ?? "";
  const hastaQuery = sp.hasta ?? "";
  const groupId = sp.grupo ?? "";
  const subcategoryId = sp.subcategoria ?? "";
  const orden: OrdenRanking = sp.orden === "importe" ? "importe" : "unidades";

  const { desde, hasta, rangoInvalido } = rangoDelPeriodo(periodo, desdeQuery, hastaQuery);

  const [{ grupos, subcategorias }, analitica, huboVentaAlgunaVez] = await Promise.all([
    obtenerFiltrosCategoria(),
    rangoInvalido ? null : obtenerAnaliticaAdmin({ desde, hasta, groupId: groupId || undefined, subcategoryId: subcategoryId || undefined }, orden),
    huboAlgunaVentaValidada(),
  ]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h1 className="title" style={{ fontSize: 28, margin: 0 }}>
          Analítica
        </h1>
        <a
          href={`/api/admin/analitica/exportar?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}&grupo=${groupId}&subcategoria=${subcategoryId}&orden=${orden}`}
          className="btn btn-fantasma cut cut-10"
        >
          Exportar CSV
        </a>
      </div>

      <FiltrosAnalitica
        grupos={grupos}
        subcategorias={subcategorias}
        periodo={periodo}
        desde={desdeQuery || new Date(desde).toISOString().slice(0, 10)}
        hasta={hastaQuery || new Date().toISOString().slice(0, 10)}
        groupId={groupId}
        subcategoryId={subcategoryId}
        orden={orden}
      />

      <div style={{ fontSize: 12, color: "var(--text-muted)", background: "var(--accent-tint)", border: "1px solid var(--border)", padding: "8px 14px", marginBottom: 18 }}>
        ⓘ Solo se cuentan pedidos con pago validado (de «Listo para envío» en adelante). Los pedidos pendientes no aparecen aquí.
      </div>

      {rangoInvalido && (
        <div style={{ fontSize: 13, color: "var(--danger-text)", background: "rgba(255,90,90,.08)", border: "1px solid var(--danger-text)", padding: "10px 14px", marginBottom: 18 }}>
          La fecha de inicio tiene que ser anterior a la de fin.
        </div>
      )}

      {!rangoInvalido && analitica && analitica.kpis.pedidos === 0 && (
        <div className="tarjeta" style={{ padding: 28, textAlign: "center", color: "var(--text-muted)" }}>
          {huboVentaAlgunaVez ? (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 15 }}>No hubo ventas validadas en este periodo.</p>
              <p style={{ margin: 0, fontSize: 13 }}>Prueba con un periodo más amplio.</p>
            </>
          ) : (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 15 }}>Todavía no hay ventas que analizar.</p>
              <p style={{ margin: 0, fontSize: 13 }}>Cuando valides tu primer pago, este tablero empezará a llenarse.</p>
            </>
          )}
        </div>
      )}

      {!rangoInvalido && analitica && analitica.kpis.pedidos > 0 && (
        <>
          <div className="admin-grid-kpis" style={{ gap: 14, marginBottom: 22 }}>
            <TarjetaKpi valor={String(analitica.kpis.piezas)} etiqueta="Piezas" />
            <TarjetaKpi valor={formatearPrecio(analitica.kpis.importe)} etiqueta="Importe" />
            <TarjetaKpi valor={String(analitica.kpis.pedidos)} etiqueta="Pedidos" />
            <TarjetaKpi valor={formatearPrecio(analitica.kpis.ticketPromedio)} etiqueta="Ticket promedio" />
          </div>

          {analitica.totalProductosConVenta < 5 && (
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              Con {analitica.totalProductosConVenta} producto{analitica.totalProductosConVenta === 1 ? "" : "s"} vendido{analitica.totalProductosConVenta === 1 ? "" : "s"}, este ranking todavía no dice mucho. Vuelve cuando tengas más ventas.
            </div>
          )}

          <div className="admin-grid-2" style={{ gap: 16 }}>
            <RankingProductos titulo="Más vendidos" productos={analitica.masVendidos} color="var(--accent)" orden={orden} />
            <RankingProductos titulo="Menos vendidos" productos={analitica.menosVendidos} color="var(--warning)" orden={orden} />
          </div>
        </>
      )}
    </div>
  );
}

function TarjetaKpi({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="tarjeta" style={{ padding: 16 }}>
      <div className="mono" style={{ fontSize: 24, fontWeight: 500 }}>
        {valor}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-title)", fontWeight: 600, textTransform: "uppercase" }}>{etiqueta}</div>
    </div>
  );
}
