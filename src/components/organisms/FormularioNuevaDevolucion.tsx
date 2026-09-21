"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  solicitarDevolucionAction,
  solicitarSubidaFotoDevolucionAction,
  confirmarFotoDevolucionAction,
} from "@/server/actions/devoluciones";
import { formatearPrecio } from "@/lib/formato";
import { Boton } from "@/components/atoms/Boton";
import type { PedidoElegibleDevolucion } from "@/server/db/queries/devoluciones";
import type { CondicionDevolucion } from "@/types/database";

const ETIQUETA_CONDICION: Record<CondicionDevolucion, string> = { sellado: "Sellado de fábrica", abierto: "Abierto o sin empaque original", otro: "Otro (dañado, incompleto...)" };
const PORCENTAJE_ESTIMADO: Record<CondicionDevolucion, number | null> = { sellado: 100, abierto: 70, otro: null };
const TAMANO_MAXIMO_MB = 5;

type PartidaSeleccionada = { incluir: boolean; qty: number; condition: CondicionDevolucion };

/**
 * D1 — el demo (`index.html`) no tiene este formulario: el botón
 * "Solicitar devolución" ahí solo muestra un toast ("Flujo de devolución
 * en la siguiente entrega", `estado.md`). Diseño propio, consistente con
 * el resto de "Mi cuenta" (mismos átomos `Boton`/tokens de `globals.css`),
 * sobre el criterio real de D1.2-D1.5.
 */
export function FormularioNuevaDevolucion({ pedidos }: { pedidos: PedidoElegibleDevolucion[] }) {
  const router = useRouter();
  const [orderId, setOrderId] = useState(pedidos[0]?.orderId ?? "");
  const pedido = pedidos.find((p) => p.orderId === orderId) ?? pedidos[0];

  const [seleccion, setSeleccion] = useState<Record<string, PartidaSeleccionada>>({});
  const [reason, setReason] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [estado, setEstado] = useState<"form" | "enviando" | "hecho">("form");
  const [error, setError] = useState<string | null>(null);

  function partida(orderItemId: string) {
    return seleccion[orderItemId] ?? { incluir: false, qty: 1, condition: "sellado" as CondicionDevolucion };
  }

  function actualizar(orderItemId: string, cambios: Partial<PartidaSeleccionada>) {
    setSeleccion((s) => ({ ...s, [orderItemId]: { ...partida(orderItemId), ...cambios } }));
  }

  const totalEstimado = useMemo(() => {
    if (!pedido) return 0;
    return pedido.items.reduce((suma, it) => {
      const sel = seleccion[it.orderItemId];
      if (!sel?.incluir) return suma;
      const pct = PORCENTAJE_ESTIMADO[sel.condition];
      if (pct === null) return suma;
      return suma + (Number(it.unitPrice) * sel.qty * pct) / 100;
    }, 0);
  }, [pedido, seleccion]);

  function elegirArchivos(e: React.ChangeEvent<HTMLInputElement>) {
    const lista = Array.from(e.target.files ?? []);
    const sobrepasado = lista.find((f) => f.size > TAMANO_MAXIMO_MB * 1024 * 1024);
    if (sobrepasado) {
      setErrorArchivo(`"${sobrepasado.name}" pesa más de ${TAMANO_MAXIMO_MB} MB.`);
      return;
    }
    setErrorArchivo(null);
    setArchivos((a) => [...a, ...lista]);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!pedido) return;

    const items = pedido.items
      .filter((it) => seleccion[it.orderItemId]?.incluir)
      .map((it) => ({ orderItemId: it.orderItemId, qty: seleccion[it.orderItemId].qty, condition: seleccion[it.orderItemId].condition }));

    if (items.length === 0) {
      setError("Elige al menos un producto a devolver.");
      return;
    }
    if (!reason.trim()) {
      setError("Cuéntanos por qué quieres devolverlo.");
      return;
    }

    setEstado("enviando");

    const resultado = await solicitarDevolucionAction({ orderId: pedido.orderId, reason, items });
    if (!resultado.ok) {
      setError(resultado.error);
      setEstado("form");
      return;
    }

    for (const archivo of archivos) {
      const firma = await solicitarSubidaFotoDevolucionAction({
        returnId: resultado.data.id,
        folio: resultado.data.folio,
        nombreArchivo: archivo.name,
        contentType: archivo.type,
      });
      if (!firma.ok) continue; // la solicitud ya quedó registrada; una foto que falla no debe tirar todo el flujo
      const subida = await fetch(firma.data.url, { method: "PUT", body: archivo, headers: { "Content-Type": archivo.type } });
      if (subida.ok) await confirmarFotoDevolucionAction(resultado.data.id, firma.data.key);
    }

    setEstado("hecho");
  }

  if (pedidos.length === 0) {
    return (
      <div style={{ padding: "44px 24px", border: "1px dashed var(--border-subtle)", background: "var(--bg-surface)", textAlign: "center", maxWidth: 680 }}>
        <p style={{ margin: 0, fontSize: 16, color: "var(--text-primary)" }}>No tienes pedidos disponibles para devolución en este momento.</p>
        <p style={{ margin: "8px 0 0", fontSize: 13.5, color: "var(--text-muted)" }}>
          Solo se puede pedir devolución de un pedido ya entregado y dentro del plazo permitido.
        </p>
      </div>
    );
  }

  if (estado === "hecho") {
    return (
      <div style={{ textAlign: "center", padding: "20px 0", maxWidth: 680 }}>
        <span style={{ display: "inline-grid", placeItems: "center", width: 76, height: 76, border: "1.5px solid var(--success)", borderRadius: "50%", color: "var(--success)", fontSize: 34 }}>✓</span>
        <h1 style={{ margin: "26px 0 0", fontSize: "clamp(24px,2.6vw,32px)", lineHeight: 1.2 }}>Recibimos tu solicitud</h1>
        <p style={{ margin: "16px auto 0", maxWidth: "56ch", fontSize: 15.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
          Un asesor la revisará y confirmará el saldo que aplica. Puedes seguir el estado en Mi cuenta → Devoluciones.
        </p>
        <div style={{ marginTop: 26 }}>
          <Boton tamano="lg" onClick={() => router.push("/mi-cuenta/devoluciones")}>Ver mis devoluciones</Boton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} style={{ maxWidth: 680 }}>
      {pedidos.length > 1 && (
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Pedido</label>
          <select
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              setSeleccion({});
            }}
            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 15, color: "var(--text-primary)" }}
          >
            {pedidos.map((p) => (
              <option key={p.orderId} value={p.orderId}>
                {p.folio} — vence en {p.diasRestantes} días
              </option>
            ))}
          </select>
        </div>
      )}

      {pedido && (
        <>
          <p style={{ margin: "0 0 16px", fontSize: 13.5, color: "var(--text-muted)" }}>
            Pedido <span className="font-data" style={{ color: "var(--text-primary)" }}>{pedido.folio}</span> · Puedes solicitar hasta{" "}
            <span style={{ color: "var(--warning)" }}>{pedido.diasRestantes} días</span> más
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pedido.items.map((it) => {
              const sel = partida(it.orderItemId);
              return (
                <div key={it.orderItemId} style={{ padding: 16, border: `1px solid ${sel.incluir ? "var(--accent)" : "var(--border)"}`, background: "var(--bg-card)" }}>
                  <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer" }}>
                    <input type="checkbox" checked={sel.incluir} onChange={(e) => actualizar(it.orderItemId, { incluir: e.target.checked })} style={{ marginTop: 3 }} />
                    <span style={{ flex: 1 }}>
                      <span style={{ display: "block", fontSize: 15, color: "var(--text-primary)" }}>{it.name}</span>
                      <span className="font-data" style={{ display: "block", marginTop: 2, fontSize: 12, color: "var(--text-muted)" }}>
                        {it.sku} · compraste {it.qtyComprada}, disponible para devolver {it.qtyDisponible}
                      </span>
                    </span>
                  </label>

                  {sel.incluir && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginTop: 14, paddingLeft: 30 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 5 }}>Cantidad</label>
                        <input
                          type="number"
                          min={1}
                          max={it.qtyDisponible}
                          value={sel.qty}
                          onChange={(e) => actualizar(it.orderItemId, { qty: Math.min(it.qtyDisponible, Math.max(1, Number(e.target.value) || 1)) })}
                          style={{ width: "100%", padding: "9px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 14, color: "var(--text-primary)" }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginBottom: 5 }}>Condición</label>
                        <select
                          value={sel.condition}
                          onChange={(e) => actualizar(it.orderItemId, { condition: e.target.value as CondicionDevolucion })}
                          style={{ width: "100%", padding: "9px 12px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 14, color: "var(--text-primary)" }}
                        >
                          {(Object.keys(ETIQUETA_CONDICION) as CondicionDevolucion[]).map((c) => (
                            <option key={c} value={c}>
                              {ETIQUETA_CONDICION[c]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 22 }}>
            <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>¿Por qué quieres devolverlo?</label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Cuéntanos el motivo"
              style={{ width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 15, color: "var(--text-primary)", resize: "vertical" }}
            />
          </div>

          <div style={{ marginTop: 22 }}>
            <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Fotos (opcional)</label>
            <label style={{ display: "inline-block", padding: "11px 18px", border: "1px solid var(--accent)", color: "var(--accent)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14, cursor: "pointer" }}>
              Agregar fotos
              <input type="file" accept=".jpg,.jpeg,.png,.heic" multiple onChange={elegirArchivos} style={{ display: "none" }} />
            </label>
            {archivos.length > 0 && (
              <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
                {archivos.map((f, i) => (
                  <li key={i} className="font-data" style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
                    {f.name}
                  </li>
                ))}
              </ul>
            )}
            {errorArchivo && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--danger-text)" }}>{errorArchivo}</p>}
          </div>

          <p style={{ margin: "22px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
            Nunca es en efectivo — el valor se abona como saldo a favor para comprar productos.
          </p>
          {totalEstimado > 0 && (
            <p style={{ margin: "6px 0 0", fontSize: 15, color: "var(--text-primary)" }}>
              Saldo estimado: <strong style={{ color: "var(--success)" }}>{formatearPrecio(totalEstimado)}</strong> — sujeto a revisión de un asesor.
            </p>
          )}

          {error && <p style={{ margin: "18px 0 0", fontSize: 14, color: "var(--danger-text)" }}>{error}</p>}

          <div style={{ marginTop: 26 }}>
            <Boton type="submit" tamano="lg" disabled={estado === "enviando"}>
              {estado === "enviando" ? "Enviando…" : "Enviar solicitud"}
            </Boton>
          </div>
        </>
      )}
    </form>
  );
}
