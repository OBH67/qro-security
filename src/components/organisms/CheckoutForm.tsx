"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/formato";
import { generarPedidoAction } from "@/server/actions/pedidos";
import { Boton } from "@/components/atoms/Boton";
import type { AddressRow, BillingProfileRow } from "@/types/database";
import type { CarritoResuelto } from "@/server/actions/carrito";

/** index.html:1026-1101 (`isCheckout`) — traducción literal, sin el bloque
 * de saldo a favor del demo (`showSaldo`/`applySaldo`): Épica D
 * (devoluciones, origen del saldo) no es parte de este incremento, así que
 * ningún cliente puede tener saldo todavía — mostrar ese bloque sería
 * simular una función que no existe. Documentado en `.devsquad/estado.md`. */
export function CheckoutForm({
  direcciones,
  datosFiscales,
  carrito,
}: {
  direcciones: AddressRow[];
  datosFiscales: BillingProfileRow[];
  carrito: CarritoResuelto;
}) {
  const router = useRouter();
  const [addressId, setAddressId] = useState(direcciones.find((a) => a.is_default)?.id ?? direcciones[0]?.id ?? "");
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [billingProfileId, setBillingProfileId] = useState(datosFiscales.find((b) => b.is_default)?.id ?? datosFiscales[0]?.id ?? "");
  const [agree, setAgree] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setError(null);
    if (!addressId) {
      setError("Elige una dirección de envío.");
      return;
    }
    if (wantsInvoice && !billingProfileId) {
      setError("Elige o captura tus datos fiscales para pedir factura.");
      return;
    }
    setEnviando(true);
    const resultado = await generarPedidoAction({
      addressId,
      wantsInvoice,
      billingProfileId: wantsInvoice ? billingProfileId : undefined,
      agree: true,
    });
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.push(`/mi-cuenta/pedidos/${resultado.data.folio}`);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 32, alignItems: "start" }} className="pagar-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>Dirección de envío</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {direcciones.length === 0 && (
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-muted)" }}>
                Todavía no tienes una dirección guardada.{" "}
                <a href="/mi-cuenta/direcciones" style={{ color: "var(--accent)" }}>Agrega una en Mi cuenta</a> antes de continuar.
              </p>
            )}
            {direcciones.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAddressId(a.id)}
                style={{ display: "flex", gap: 14, alignItems: "flex-start", width: "100%", textAlign: "left", padding: 18, background: "var(--bg-card)", border: `1px solid ${addressId === a.id ? "var(--accent)" : "var(--border)"}` }}
              >
                <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "0 0 auto", marginTop: 3, border: `1px solid ${addressId === a.id ? "var(--accent)" : "var(--border-subtle)"}`, background: addressId === a.id ? "var(--accent)" : "transparent" }} />
                <span>
                  <span style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>{a.label}</span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>
                    {a.street} {a.ext_number}{a.int_number ? `, Int. ${a.int_number}` : ""}, Col. {a.neighborhood}, C.P. {a.postal_code}, {a.municipality}, {a.state} · Recibe {a.recipient_name}
                  </span>
                </span>
              </button>
            ))}
            <a href="/mi-cuenta/direcciones" style={{ alignSelf: "flex-start", fontSize: 14, color: "var(--accent)", padding: "6px 0" }}>Agregar dirección nueva</a>
          </div>
        </div>

        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>Facturación</h2>
          <button
            type="button"
            onClick={() => setWantsInvoice((v) => !v)}
            style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: 18, border: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <span style={{ position: "relative", width: 46, height: 26, flex: "0 0 auto", borderRadius: 13, border: `1px solid ${wantsInvoice ? "var(--accent)" : "var(--border-subtle)"}`, background: wantsInvoice ? "var(--bg-hover)" : "var(--bg-surface)" }}>
              <span style={{ position: "absolute", top: 3, left: wantsInvoice ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: wantsInvoice ? "var(--accent)" : "var(--text-disabled)" }} />
            </span>
            <span>
              <span style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>Quiero factura</span>
              <span className="font-data" style={{ display: "block", marginTop: 3, fontSize: 12.5, color: "var(--text-muted)" }}>
                {datosFiscales[0] ? `RFC ${datosFiscales[0].rfc} · ${datosFiscales[0].tax_regime}` : "Captura tus datos fiscales en Mi cuenta"}
              </span>
            </span>
          </button>
          {wantsInvoice && datosFiscales.length === 0 && (
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--warning)" }}>
              Necesitas capturar tus datos fiscales antes de continuar.{" "}
              <a href="/mi-cuenta/datos-fiscales" style={{ color: "var(--accent)" }}>Agrégalos aquí</a>.
            </p>
          )}
          {wantsInvoice && datosFiscales.length > 1 && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Usar estos datos fiscales</label>
              <select
                value={billingProfileId}
                onChange={(e) => setBillingProfileId(e.target.value)}
                style={{ width: "100%", maxWidth: 360, padding: "11px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", color: "var(--text-primary)", fontSize: 15 }}
              >
                {datosFiscales.map((f) => (
                  <option key={f.id} value={f.id}>{f.rfc} · {f.legal_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>Método de pago</h2>
          <div style={{ padding: 18, border: "1px solid var(--accent)", background: "var(--bg-hover)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "0 0 auto", marginTop: 3, border: "1px solid var(--accent)", background: "var(--accent)" }} />
            <span>
              <span style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>Transferencia o depósito (SPEI)</span>
              <span style={{ display: "block", marginTop: 4, fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>
                Al generar tu pedido te mostramos la CLABE, el concepto y el importe exacto. Subes tu comprobante en Mis pedidos.
              </span>
            </span>
          </div>
        </div>
      </div>

      <aside style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, position: "sticky", top: 96 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>Tu pedido</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          {carrito.items.map((it) => (
            <div key={it.productId} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span className="font-data" style={{ fontSize: 12, color: "var(--accent)", minWidth: 24 }}>×{it.qty}</span>
              <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4, color: "var(--text-primary)" }}>{it.name}</span>
              <span className="font-data" style={{ fontSize: 13, color: "var(--text-muted)" }}>{formatearPrecio(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0 4px" }}>
          <span style={{ fontSize: 17 }}>Total</span>
          <span className="font-data" style={{ fontSize: 28, fontWeight: 600 }}>{formatearPrecio(carrito.subtotal)}</span>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "var(--text-muted)" }}>IVA incluido · Envío se confirma con tu asesor</p>
        <button type="button" onClick={() => setAgree((v) => !v)} style={{ display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", fontSize: 13.5, lineHeight: 1.5, color: "var(--text-muted)", marginBottom: 18 }}>
          <span style={{ width: 18, height: 18, borderRadius: 3, flex: "0 0 auto", display: "grid", placeItems: "center", border: `1px solid ${agree ? "var(--accent)" : "var(--border-subtle)"}`, background: agree ? "var(--accent)" : "transparent", color: "var(--bg-base)", fontSize: 12 }}>
            {agree && "✓"}
          </span>
          <span>Entiendo que mi pedido se confirma al subir mi comprobante de pago.</span>
        </button>
        {error && <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--danger-text)" }}>{error}</p>}
        <Boton anchoCompleto tamano="lg" disabled={!agree || enviando || !addressId} onClick={generar}>
          {enviando ? "Generando…" : "Generar pedido"}
        </Boton>
      </aside>
      <style>{`
        @media (max-width: 899px) { .pagar-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
