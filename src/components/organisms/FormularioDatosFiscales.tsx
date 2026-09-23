"use client";

import { useState } from "react";
import { esquemaDatosFiscales, REGIMENES_FISCALES, USOS_CFDI } from "@/lib/esquemas/datosFiscales";
import { guardarDatosFiscales } from "@/server/actions/datosFiscales";
import { CampoConError } from "@/components/molecules/CampoConError";
import { Boton } from "@/components/atoms/Boton";

const VACIO: { rfc: string; legalName: string; taxRegime: string; cfdiUse: string; postalCode: string } = {
  rfc: "", legalName: "", taxRegime: REGIMENES_FISCALES[0], cfdiUse: USOS_CFDI[0], postalCode: "",
};

/** index.html:2598-2604 (campos fiscales del registro, `regStep === 3`)
 * reutilizados como formulario independiente en Mi cuenta (B3.2/B3.3). */
export function FormularioDatosFiscales({ onGuardado }: { onGuardado: () => void }) {
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parseo = esquemaDatosFiscales.safeParse(datos);
    if (!parseo.success) {
      setErrores(Object.fromEntries(parseo.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrores({});
    setEnviando(true);
    const resultado = await guardarDatosFiscales(parseo.data);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setDatos(VACIO);
    onGuardado();
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24, border: "1px solid var(--border)", background: "var(--bg-card)", maxWidth: 620 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 18 }}>
        <CampoConError label="RFC" placeholder="XAXX010101000" value={datos.rfc} onChange={(e) => setDatos((d) => ({ ...d, rfc: e.target.value }))} error={errores.rfc} />
        <CampoConError label="Nombre o razón social" value={datos.legalName} onChange={(e) => setDatos((d) => ({ ...d, legalName: e.target.value }))} error={errores.legalName} />
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Régimen fiscal</label>
          <select value={datos.taxRegime} onChange={(e) => setDatos((d) => ({ ...d, taxRegime: e.target.value }))} style={{ width: "100%", padding: "11px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", color: "var(--text-primary)", fontSize: 15 }}>
            {REGIMENES_FISCALES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Uso de CFDI</label>
          <select value={datos.cfdiUse} onChange={(e) => setDatos((d) => ({ ...d, cfdiUse: e.target.value }))} style={{ width: "100%", padding: "11px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", color: "var(--text-primary)", fontSize: 15 }}>
            {USOS_CFDI.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <CampoConError label="Código postal fiscal" placeholder="76000" value={datos.postalCode} onChange={(e) => setDatos((d) => ({ ...d, postalCode: e.target.value }))} error={errores.postalCode} />
      </div>
      {error && <p style={{ margin: 0, fontSize: 13.5, color: "var(--danger-text)" }}>{error}</p>}
      <Boton type="submit" cargando={enviando} textoCargando="Guardando…" style={{ alignSelf: "flex-start" }}>
        Guardar datos fiscales
      </Boton>
    </form>
  );
}
