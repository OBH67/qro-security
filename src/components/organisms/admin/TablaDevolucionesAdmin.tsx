"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatearPrecio } from "@/lib/formato";
import {
  obtenerDetalleDevolucionAction,
  aprobarDevolucionAction,
  rechazarDevolucionAction,
} from "@/server/actions/admin/devoluciones";
import type { DetalleDevolucionAdmin, FilaDevolucionAdmin } from "@/server/db/queries/admin/devoluciones";
import type { EstadoDevolucion } from "@/types/database";

const ESTILO_ESTADO: Record<EstadoDevolucion, { label: string; estilo: React.CSSProperties }> = {
  solicitada: { label: "Solicitada", estilo: { background: "transparent", border: "1px solid var(--warning)", color: "var(--warning)" } },
  en_revision: { label: "En revisión", estilo: { background: "var(--accent)", color: "#07111C" } },
  aprobada: { label: "Aprobada", estilo: { background: "transparent", border: "1px solid var(--success)", color: "var(--success)" } },
  rechazada: { label: "Rechazada", estilo: { background: "transparent", border: "1px solid var(--danger-text)", color: "var(--danger-text)" } },
};

type PorcentajeElegido = 100 | 70 | "otro";

/** panel-admin-maqueta.html:776-849 (`isDevoluciones`) — traducción
 * literal: tabla + cajón de resolución. D2.3: 100%/70%/otro con el monto
 * calculado en vivo; D2.4: rechazo exige motivo. */
export function TablaDevolucionesAdmin({ devoluciones }: { devoluciones: FilaDevolucionAdmin[] }) {
  const router = useRouter();
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleDevolucionAdmin | null>(null);
  const [cargando, setCargando] = useState(false);
  const [pctElegido, setPctElegido] = useState<PorcentajeElegido>(100);
  const [pctOtro, setPctOtro] = useState("");
  const [destinoPieza, setDestinoPieza] = useState<"nueva" | "usado" | "no">("nueva");
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function abrirCajon(id: string) {
    setSeleccionId(id);
    setDetalle(null);
    setError(null);
    setPctElegido(100);
    setPctOtro("");
    setDestinoPieza("nueva");
    setMotivoRechazo("");
    setMostrarRechazo(false);
    setCargando(true);
    startTransition(async () => {
      const resultado = await obtenerDetalleDevolucionAction(id);
      setCargando(false);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setDetalle(resultado.data);
    });
  }

  function cerrarCajon() {
    setSeleccionId(null);
    setDetalle(null);
    setError(null);
  }

  const item = detalle?.items[0];
  const baseCalculo = useMemo(() => {
    if (!item) return 0;
    return Number(item.unitPrice) * item.qty;
  }, [item]);

  const porcentajeNumerico = pctElegido === "otro" ? Number(pctOtro) || 0 : pctElegido;
  const montoCalculado = Math.round(baseCalculo * (porcentajeNumerico / 100) * 100) / 100;
  const saldoResultante = (detalle?.saldoActualCliente ?? 0) + montoCalculado;

  function confirmarAprobar() {
    if (!detalle) return;
    setError(null);
    startTransition(async () => {
      const resultado = await aprobarDevolucionAction(detalle.id, porcentajeNumerico, destinoPieza === "nueva");
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      cerrarCajon();
      router.refresh();
    });
  }

  function confirmarRechazar() {
    if (!detalle) return;
    setError(null);
    startTransition(async () => {
      const resultado = await rechazarDevolucionAction(detalle.id, motivoRechazo);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      cerrarCajon();
      router.refresh();
    });
  }

  const resuelta = detalle?.status === "aprobada" || detalle?.status === "rechazada";

  return (
    <>
      <div className="tarjeta">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Pedido</th>
              <th>Producto</th>
              <th>Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {devoluciones.map((d) => {
              const est = ESTILO_ESTADO[d.status];
              return (
                <tr key={d.id} className="fila" style={{ cursor: "pointer" }} onClick={() => abrirCajon(d.id)}>
                  <td className="mono">{d.folio}</td>
                  <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(d.fecha).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td>{d.cliente}</td>
                  <td className="mono">{d.pedidoFolio}</td>
                  <td>
                    {d.producto}
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {d.condicion} · {d.pctSugerido}%
                    </div>
                  </td>
                  <td className="mono">{formatearPrecio(d.monto)}</td>
                  <td>
                    <span className="badge" style={est.estilo}>
                      {est.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {devoluciones.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                  No hay devoluciones que coincidan con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {seleccionId && (
        <div className="modal-overlay" style={{ justifyContent: "flex-end" }} onClick={cerrarCajon}>
          <div className="tarjeta sg-in" style={{ width: "min(680px, 94vw)", height: "100vh", overflow: "auto", padding: 22 }} onClick={(e) => e.stopPropagation()}>
            {cargando && <p style={{ color: "var(--text-muted)" }}>Cargando…</p>}
            {!cargando && detalle && item && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div className="title mono" style={{ fontSize: 18 }}>
                      {detalle.folio}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                      {detalle.cliente} · pedido {detalle.pedidoFolio}
                    </div>
                  </div>
                  <button className="btn btn-fantasma btn-sm" onClick={cerrarCajon}>
                    ✕
                  </button>
                </div>

                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Producto devuelto
                </div>
                <div style={{ fontSize: 14, marginBottom: 2 }}>{item.producto}</div>
                <div className="mono" style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
                  {item.sku} · {item.qty} pieza{item.qty === 1 ? "" : "s"} · {formatearPrecio(item.creditAmount)}
                </div>

                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Motivo del cliente
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 14 }}>&ldquo;{detalle.reason}&rdquo;</div>

                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Condición declarada
                </div>
                <div className="badge" style={{ background: "transparent", border: "1px solid var(--border-strong)", color: "var(--text-primary)", marginBottom: 16 }}>
                  {item.condition}
                </div>

                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
                  Fotos del cliente
                </div>
                {detalle.fotos.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 16 }}>
                    {detalle.fotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: "block" }}>
                        <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", height: 200, position: "relative", overflow: "hidden" }}>
                          <Image src={url} alt={`Foto ${i + 1} de la devolución`} fill style={{ objectFit: "contain" }} unoptimized />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "var(--bg-inset)", border: "1px solid var(--border)", padding: 14, textAlign: "center", color: "var(--text-dim)", fontSize: 13, marginBottom: 16 }}>
                    El cliente no subió fotos.
                  </div>
                )}

                {resuelta ? (
                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, fontSize: 14 }}>
                    Esta devolución ya fue resuelta:{" "}
                    <span className="badge" style={ESTILO_ESTADO[detalle.status].estilo}>
                      {ESTILO_ESTADO[detalle.status].label}
                    </span>
                  </div>
                ) : (
                  <>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 16 }}>
                      <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                        Saldo a favor que se otorga
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14, marginBottom: 10 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="radio" name="pct" checked={pctElegido === 100} onChange={() => setPctElegido(100)} />
                          100% — {formatearPrecio(baseCalculo)} <span style={{ color: "var(--text-muted)", fontSize: 12 }}>(propuesto)</span>
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="radio" name="pct" checked={pctElegido === 70} onChange={() => setPctElegido(70)} />
                          70% — {formatearPrecio(baseCalculo * 0.7)}
                        </label>
                        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="radio" name="pct" checked={pctElegido === "otro"} onChange={() => setPctElegido("otro")} />
                          Otro
                          {pctElegido === "otro" && (
                            <input
                              className="campo mono"
                              type="number"
                              min={0}
                              max={100}
                              style={{ width: 80, marginLeft: 4 }}
                              value={pctOtro}
                              onChange={(e) => setPctOtro(e.target.value)}
                              placeholder="%"
                            />
                          )}
                        </label>
                      </div>
                      <div className="mono" style={{ fontSize: 30, fontWeight: 500 }}>
                        {formatearPrecio(montoCalculado)}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                        Saldo actual: {formatearPrecio(detalle.saldoActualCliente)} · Quedará con: {formatearPrecio(saldoResultante)}
                      </div>
                    </div>

                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginBottom: 18 }}>
                      <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                        ¿Qué pasa con la pieza física?
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <input type="radio" name="dest" checked={destinoPieza === "nueva"} onChange={() => setDestinoPieza("nueva")} style={{ marginTop: 3 }} />
                          <span>
                            Regresa al inventario como nueva
                            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>stock de {item.sku} sube {item.qty} pieza{item.qty === 1 ? "" : "s"}</div>
                          </span>
                        </label>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <input type="radio" name="dest" checked={destinoPieza === "usado"} onChange={() => setDestinoPieza("usado")} style={{ marginTop: 3 }} />
                          <span>
                            Publicarla aparte como «Usado»
                            <div style={{ color: "var(--text-muted)", fontSize: 12 }}>captúrala luego desde Catálogo → Nuevo producto</div>
                          </span>
                        </label>
                        <label style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                          <input type="radio" name="dest" checked={destinoPieza === "no"} onChange={() => setDestinoPieza("no")} style={{ marginTop: 3 }} />
                          <span>No revenderla</span>
                        </label>
                      </div>
                    </div>

                    {mostrarRechazo && (
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>Motivo del rechazo *</label>
                        <textarea className="campo" style={{ height: 72, paddingTop: 10 }} value={motivoRechazo} onChange={(e) => setMotivoRechazo(e.target.value)} placeholder="El cliente lo verá" />
                      </div>
                    )}

                    {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}

                    {!mostrarRechazo ? (
                      <>
                        <button className="btn btn-primario cut cut-12" style={{ width: "100%", marginBottom: 10 }} onClick={confirmarAprobar} disabled={isPending || (pctElegido === "otro" && !pctOtro)}>
                          {isPending ? "Procesando…" : `Aprobar y abonar ${formatearPrecio(montoCalculado)}`}
                        </button>
                        <button className="btn btn-peligro cut cut-10" style={{ width: "100%" }} onClick={() => setMostrarRechazo(true)} disabled={isPending}>
                          Rechazar devolución
                        </button>
                      </>
                    ) : (
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="btn btn-fantasma cut cut-10" style={{ flex: 1 }} onClick={() => setMostrarRechazo(false)} disabled={isPending}>
                          Volver
                        </button>
                        <button className="btn btn-peligro cut cut-10" style={{ flex: 1 }} onClick={confirmarRechazar} disabled={isPending || !motivoRechazo.trim()}>
                          {isPending ? "Procesando…" : "Confirmar rechazo"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {!cargando && error && !detalle && <p style={{ color: "var(--danger-text)" }}>{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
