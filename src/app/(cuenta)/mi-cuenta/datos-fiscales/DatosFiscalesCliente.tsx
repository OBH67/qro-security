"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarDatosFiscales, marcarDatosFiscalesComoPredeterminados } from "@/server/actions/datosFiscales";
import { FormularioDatosFiscales } from "@/components/organisms/FormularioDatosFiscales";
import { Boton } from "@/components/atoms/Boton";
import type { BillingProfileRow } from "@/types/database";

/** index.html:1275-1283 (`secFacturacion`) — B3.2/B3.3. El bloque móvil
 * (`.cuenta-movil-solo`) traduce el mockup `Panel_Usuario_Movil.dc.html`
 * (`fiscalRows`, filas clave-valor); el botón "Editar datos fiscales" del
 * mockup asume un solo registro — aquí puede haber varios, así que se
 * traduce como "Usar por defecto" por registro (acción real, igual que en
 * Direcciones) en vez de una edición in situ que la app tampoco tiene en
 * escritorio (decisión explícita de la dueña). */
export function DatosFiscalesCliente({ registros }: { registros: BillingProfileRow[] }) {
  const router = useRouter();
  const [mostrarForma, setMostrarForma] = useState(registros.length === 0);

  async function eliminar(id: string) {
    await borrarDatosFiscales(id);
    router.refresh();
  }

  async function marcarDefault(id: string) {
    await marcarDatosFiscalesComoPredeterminados(id);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 620 }}>
      <div className="cuenta-escritorio-solo" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {registros.map((f) => (
          <div key={f.id} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 20 }}>
            <Dato etiqueta="RFC" valor={f.rfc} mono />
            <Dato etiqueta="Razón social" valor={f.legal_name} />
            <Dato etiqueta="Régimen fiscal" valor={f.tax_regime} />
            <Dato etiqueta="Uso de CFDI" valor={f.cfdi_use} />
            <Dato etiqueta="C.P. fiscal" valor={f.postal_code} mono />
            <div style={{ gridColumn: "1 / -1" }}>
              <button type="button" onClick={() => eliminar(f.id)} style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cuenta-movil-solo" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {registros.map((f) => (
          <div key={f.id}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, background: "#1F3244", border: "1px solid #1F3244" }}>
              <FilaMovil etiqueta="RFC" valor={f.rfc} mono />
              <FilaMovil etiqueta="Razón social" valor={f.legal_name} />
              <FilaMovil etiqueta="Régimen fiscal" valor={f.tax_regime} />
              <FilaMovil etiqueta="Uso de CFDI" valor={f.cfdi_use} />
              <FilaMovil etiqueta="C.P. fiscal" valor={f.postal_code} mono />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
              {!f.is_default && (
                <button type="button" onClick={() => marcarDefault(f.id)} style={{ fontSize: 13.5, color: "#9FB2C3" }}>
                  Usar por defecto
                </button>
              )}
              <button type="button" onClick={() => eliminar(f.id)} style={{ fontSize: 13.5, color: "#9FB2C3" }}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarForma ? (
        <FormularioDatosFiscales
          onGuardado={() => {
            setMostrarForma(false);
            router.refresh();
          }}
        />
      ) : (
        <>
          <Boton variante="secundaria" onClick={() => setMostrarForma(true)} className="cuenta-escritorio-solo" style={{ alignSelf: "flex-start" }}>
            Agregar datos fiscales
          </Boton>
          <button
            type="button"
            onClick={() => setMostrarForma(true)}
            className="cuenta-movil-solo"
            style={{ width: "100%", padding: 14, border: "1px solid #3CE7FF", color: "#3CE7FF", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15 }}
          >
            Agregar datos fiscales
          </button>
        </>
      )}
    </div>
  );
}

function FilaMovil({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "14px 15px", background: "#0F1D2B" }}>
      <span style={{ flex: "0 0 108px", fontSize: 12.5, color: "#9FB2C3" }}>{etiqueta}</span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          textAlign: "right",
          fontSize: mono ? 14.5 : 15,
          color: "#EAF2F8",
          ...(mono ? { fontFamily: "'IBM Plex Mono',monospace" } : {}),
        }}
      >
        {valor}
      </span>
    </div>
  );
}

function Dato({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)" }}>{etiqueta}</span>
      <span className={mono ? "font-data" : undefined} style={{ display: "block", marginTop: 5, fontSize: 16 }}>{valor}</span>
    </div>
  );
}
