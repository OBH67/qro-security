"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarDatosFiscales } from "@/server/actions/datosFiscales";
import { FormularioDatosFiscales } from "@/components/organisms/FormularioDatosFiscales";
import { Boton } from "@/components/atoms/Boton";
import type { BillingProfileRow } from "@/types/database";

/** index.html:1275-1283 (`secFacturacion`) — B3.2/B3.3. */
export function DatosFiscalesCliente({ registros }: { registros: BillingProfileRow[] }) {
  const router = useRouter();
  const [mostrarForma, setMostrarForma] = useState(registros.length === 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 620 }}>
      {registros.map((f) => (
        <div key={f.id} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 20 }}>
          <Dato etiqueta="RFC" valor={f.rfc} mono />
          <Dato etiqueta="Razón social" valor={f.legal_name} />
          <Dato etiqueta="Régimen fiscal" valor={f.tax_regime} />
          <Dato etiqueta="Uso de CFDI" valor={f.cfdi_use} />
          <Dato etiqueta="C.P. fiscal" valor={f.postal_code} mono />
          <div style={{ gridColumn: "1 / -1" }}>
            <button
              type="button"
              onClick={async () => {
                await borrarDatosFiscales(f.id);
                router.refresh();
              }}
              style={{ fontSize: 13.5, color: "var(--text-muted)" }}
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      {mostrarForma ? (
        <FormularioDatosFiscales
          onGuardado={() => {
            setMostrarForma(false);
            router.refresh();
          }}
        />
      ) : (
        <Boton variante="secundaria" onClick={() => setMostrarForma(true)} style={{ alignSelf: "flex-start" }}>
          Agregar datos fiscales
        </Boton>
      )}
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
