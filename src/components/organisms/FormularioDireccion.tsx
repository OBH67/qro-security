"use client";

import { useState } from "react";
import { esquemaDireccion } from "@/lib/esquemas/direccion";
import { guardarDireccion } from "@/server/actions/direcciones";
import { CampoConError } from "@/components/molecules/CampoConError";
import { Boton } from "@/components/atoms/Boton";

const VACIO = {
  label: "", street: "", extNumber: "", intNumber: "", postalCode: "",
  neighborhood: "", municipality: "", state: "", recipientName: "", directions: "",
};

/** index.html:975-1002 (campos de dirección del registro, `regStep === 2`)
 * reutilizados como formulario independiente para "Agregar dirección
 * nueva" — el demo solo simula esa acción (`addAddress: () =>
 * this.say(...)`, index.html:2630); aquí se construye el formulario real
 * con los mismos campos, ya que B3.1 lo exige y no hay otra referencia
 * visual de la que partir. */
export function FormularioDireccion({ onGuardado }: { onGuardado: () => void }) {
  const [datos, setDatos] = useState(VACIO);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function campo(clave: keyof typeof VACIO) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setDatos((d) => ({ ...d, [clave]: e.target.value }));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parseo = esquemaDireccion.safeParse(datos);
    if (!parseo.success) {
      setErrores(Object.fromEntries(parseo.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrores({});
    setEnviando(true);
    const resultado = await guardarDireccion(parseo.data);
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    setDatos(VACIO);
    onGuardado();
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 20, padding: 24, border: "1px solid var(--border)", background: "var(--bg-card)", maxWidth: 680 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 18 }}>
        <CampoConError label="Nombre de la dirección" placeholder="Casa, Oficina..." value={datos.label} onChange={campo("label")} error={errores.label} />
        <div style={{ gridColumn: "span 2" }}>
          <CampoConError label="Calle" placeholder="Av. Ejemplo" value={datos.street} onChange={campo("street")} error={errores.street} />
        </div>
        <CampoConError label="Número exterior" placeholder="123" value={datos.extNumber} onChange={campo("extNumber")} error={errores.extNumber} />
        <CampoConError label="Número interior (opcional)" placeholder="Depto. 4" value={datos.intNumber} onChange={campo("intNumber")} />
        <CampoConError label="Código postal" placeholder="76000" value={datos.postalCode} onChange={campo("postalCode")} error={errores.postalCode} />
        <CampoConError label="Colonia" value={datos.neighborhood} onChange={campo("neighborhood")} error={errores.neighborhood} />
        <CampoConError label="Municipio" placeholder="Querétaro" value={datos.municipality} onChange={campo("municipality")} error={errores.municipality} />
        <CampoConError label="Estado" placeholder="Querétaro" value={datos.state} onChange={campo("state")} error={errores.state} />
        <div style={{ gridColumn: "span 2" }}>
          <CampoConError label="Nombre de quien recibe" value={datos.recipientName} onChange={campo("recipientName")} error={errores.recipientName} />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <CampoConError label="Referencias para el repartidor" placeholder="Portón negro, entre farmacia y papelería" value={datos.directions} onChange={campo("directions")} />
        </div>
      </div>
      {error && <p style={{ margin: 0, fontSize: 13.5, color: "var(--danger-text)" }}>{error}</p>}
      <Boton type="submit" disabled={enviando} style={{ alignSelf: "flex-start" }}>
        {enviando ? "Guardando…" : "Guardar dirección"}
      </Boton>
    </form>
  );
}
