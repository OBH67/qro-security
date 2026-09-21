"use client";

import { useState } from "react";
import { formatearPrecio } from "@/lib/formato";
import { Boton } from "@/components/atoms/Boton";

/** index.html:1123-1174 — "Datos para transferir". C1.3/C1.6: los datos
 * bancarios los lee el servidor de `settings` (H4), nunca están en el
 * código; si el admin todavía no los ha llenado (H4 es otro incremento),
 * se muestra un estado vacío explícito en vez de inventar datos de
 * ejemplo — decisión documentada en `.devsquad/estado.md` de este
 * incremento. */
export function DatosTransferencia({
  folio,
  total,
  datosBancarios,
  mostrarBotonSubir,
  hrefSubir,
}: {
  folio: string;
  total: string;
  datosBancarios: { bankName: string | null; beneficiary: string | null; clabe: string | null; accountNumber: string | null };
  mostrarBotonSubir: boolean;
  hrefSubir: string;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const faltanDatos = !datosBancarios.bankName || !datosBancarios.clabe;

  async function copiar(texto: string, etiqueta: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(etiqueta);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // Sin permiso de portapapeles: el dato sigue visible en pantalla
      // para copiarlo a mano, no es un caso que deba tumbar la pantalla.
    }
  }

  if (faltanDatos) {
    return (
      <div style={{ marginTop: 34, padding: 24, border: "1px solid var(--warning)", background: "rgba(255,181,71,.06)" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 20 }}>Datos para transferir</h2>
        <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
          Tu pedido <span className="font-data">{folio}</span> se generó correctamente. Un asesor te compartirá los
          datos bancarios para completar tu transferencia — todavía no están cargados en el sistema.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 34, padding: 28, border: "1px solid var(--accent)", background: "var(--bg-card)",
        boxShadow: "var(--shadow-glow-primary)",
      }}
    >
      <h2 style={{ margin: "0 0 20px", fontSize: 22 }}>Datos para transferir</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <FilaDato label="Banco" valor={datosBancarios.bankName!} />
        <FilaDato label="Beneficiario" valor={datosBancarios.beneficiary ?? "—"} />
        <FilaDato label="Número de cuenta" valor={datosBancarios.accountNumber ?? "—"} />
      </div>

      <div style={{ marginTop: 22 }}>
        <span style={{ fontSize: 14, color: "var(--text-muted)" }}>CLABE interbancaria</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
          <span className="font-data" style={{ fontSize: "clamp(18px,2.2vw,24px)", letterSpacing: 1, color: "var(--text-primary)" }}>
            {datosBancarios.clabe}
          </span>
          <button type="button" onClick={() => copiar(datosBancarios.clabe!, "CLABE")} style={{ padding: "11px 18px", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 14 }}>
            {copiado === "CLABE" ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20, marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
        <div>
          <span style={{ display: "block", fontSize: 14, color: "var(--text-muted)" }}>Concepto o referencia</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
            <span className="font-data" style={{ fontSize: 20, color: "var(--text-primary)" }}>{folio}</span>
            <button type="button" onClick={() => copiar(folio, "Referencia")} style={{ padding: "8px 14px", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 13 }}>
              {copiado === "Referencia" ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
        <div>
          <span style={{ display: "block", fontSize: 14, color: "var(--text-muted)" }}>Importe exacto a transferir</span>
          <span className="font-data" style={{ display: "block", marginTop: 8, fontSize: 30, fontWeight: 600, color: "var(--accent)" }}>
            {formatearPrecio(total)}
          </span>
        </div>
      </div>

      {mostrarBotonSubir && (
        <div style={{ marginTop: 24 }}>
          <Boton href={hrefSubir} tamano="lg">Subir comprobante ahora</Boton>
        </div>
      )}
    </div>
  );
}

function FilaDato({ label, valor }: { label: string; valor: string }) {
  return (
    <div style={{ display: "flex", gap: 16, justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 14, color: "var(--text-muted)" }}>{label}</span>
      <span className="font-data" style={{ fontSize: 15, color: "var(--text-primary)" }}>{valor}</span>
    </div>
  );
}
