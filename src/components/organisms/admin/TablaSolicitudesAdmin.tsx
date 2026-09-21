"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { marcarEnSeguimientoAction, marcarCerradaAction } from "@/server/actions/admin/solicitudes";
import { formatearPrecio } from "@/lib/formato";
import type { EstadoSolicitudServicio, ServiceRequestRow } from "@/types/database";

const ETIQUETA_SERVICIO: Record<string, string> = {
  monitoreo: "Monitoreo de alarmas 24/7",
  guardias: "Guardias de seguridad",
  financiamiento: "Financiamiento y créditos",
};

const ETIQUETA_CLIENTE: Record<string, string> = { particular: "Particular", negocio: "Negocio", empresa: "Empresa" };

const ETIQUETA_INMUEBLE: Record<string, string> = { casa: "Casa", local: "Local", oficina: "Oficina", bodega: "Bodega", industria: "Industria", otro: "Otro" };

const ESTILO_ESTADO: Record<EstadoSolicitudServicio, { label: string; estilo: React.CSSProperties }> = {
  nueva: { label: "Nueva", estilo: { background: "transparent", border: "1px solid var(--warning)", color: "var(--warning)" } },
  contactada: { label: "En seguimiento", estilo: { background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)" } },
  cerrada: { label: "Cerrada", estilo: { background: "transparent", border: "1px solid var(--text-muted)", color: "var(--text-muted)" } },
};

/** panel-admin-maqueta.html:851-910 (`isSolicitudes`) — traducción
 * literal: bandeja + cajón de contacto. E2.1: cada fila ya trae todos
 * los datos capturados, así que el cajón no necesita una carga aparte. */
export function TablaSolicitudesAdmin({ solicitudes }: { solicitudes: ServiceRequestRow[] }) {
  const router = useRouter();
  const [seleccionId, setSeleccionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const seleccion = solicitudes.find((s) => s.id === seleccionId) ?? null;

  function cerrarCajon() {
    setSeleccionId(null);
    setError(null);
  }

  function confirmar(accion: "seguimiento" | "cerrada") {
    if (!seleccion) return;
    setError(null);
    startTransition(async () => {
      const resultado = accion === "seguimiento" ? await marcarEnSeguimientoAction(seleccion.id) : await marcarCerradaAction(seleccion.id);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      cerrarCajon();
      router.refresh();
    });
  }

  return (
    <>
      <div className="tarjeta">
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Nombre</th>
              <th>Servicio</th>
              <th>Ubicación</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((s) => {
              const est = ESTILO_ESTADO[s.status];
              return (
                <tr key={s.id} className="fila" style={{ cursor: "pointer" }} onClick={() => setSeleccionId(s.id)}>
                  <td className="mono">{s.folio}</td>
                  <td className="mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                    {new Date(s.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td>
                    {s.full_name}
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ETIQUETA_CLIENTE[s.client_type]}</div>
                  </td>
                  <td>{ETIQUETA_SERVICIO[s.service_type]}</td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {s.municipality}, {s.state}
                  </td>
                  <td>
                    <span className="badge" style={est.estilo}>
                      {est.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                  No hay solicitudes que coincidan con este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {seleccion && (
        <div className="modal-overlay" style={{ justifyContent: "flex-end" }} onClick={cerrarCajon}>
          <div className="tarjeta sg-in" style={{ width: 420, height: "100vh", overflow: "auto", padding: 22 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div className="title mono" style={{ fontSize: 18 }}>
                {seleccion.folio}
              </div>
              <button className="btn btn-fantasma btn-sm" onClick={cerrarCajon}>
                ✕
              </button>
            </div>

            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Contacto</div>
            <div style={{ fontSize: 14 }}>
              {seleccion.full_name} · {ETIQUETA_CLIENTE[seleccion.client_type]}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 14 }}>
              {seleccion.phone} · {seleccion.email}
            </div>

            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Servicio de interés
            </div>
            <div style={{ fontSize: 14, marginBottom: 14 }}>
              {ETIQUETA_SERVICIO[seleccion.service_type]}
              {seleccion.service_type === "financiamiento" && seleccion.amount && (
                <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                  {formatearPrecio(seleccion.amount)}
                  {seleccion.term_months ? ` · ${seleccion.term_months} meses` : ""}
                </div>
              )}
            </div>

            <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
              Ubicación e inmueble
            </div>
            <div style={{ fontSize: 14, marginBottom: 20 }}>
              {seleccion.municipality}, {seleccion.state}
              {seleccion.neighborhood ? ` · ${seleccion.neighborhood}` : ""} · {ETIQUETA_INMUEBLE[seleccion.property_type]}
            </div>

            {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}

            {seleccion.status !== "cerrada" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {seleccion.status === "nueva" && (
                  <button className="btn btn-primario cut cut-10" onClick={() => confirmar("seguimiento")} disabled={isPending}>
                    {isPending ? "Procesando…" : "Marcar en seguimiento"}
                  </button>
                )}
                <button className="btn btn-secundario cut cut-10" onClick={() => confirmar("cerrada")} disabled={isPending}>
                  {isPending ? "Procesando…" : "Marcar cerrada"}
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
              <a className="btn btn-fantasma btn-sm" style={{ flex: 1, textAlign: "center" }} href={`tel:${seleccion.phone}`}>
                Llamar
              </a>
              <a className="btn btn-fantasma btn-sm" style={{ flex: 1, textAlign: "center" }} href={`https://wa.me/${seleccion.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <a className="btn btn-fantasma btn-sm" style={{ flex: 1, textAlign: "center" }} href={`mailto:${seleccion.email}`}>
                Correo
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
