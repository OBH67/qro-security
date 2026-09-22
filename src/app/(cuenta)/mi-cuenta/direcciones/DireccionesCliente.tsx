"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarDireccion, marcarComoPredeterminada } from "@/server/actions/direcciones";
import { FormularioDireccion } from "@/components/organisms/FormularioDireccion";
import { Boton } from "@/components/atoms/Boton";
import type { AddressRow } from "@/types/database";

/** index.html:1263-1273 (`secDirecciones`) — B3.1. El bloque móvil
 * (`.cuenta-movil-solo`) traduce el mockup `Panel_Usuario_Movil.dc.html`
 * (tarjeta con tag + detalle + "Usar por defecto", esta última ahora una
 * acción real — la app no tenía forma de cambiar la dirección
 * predeterminada después de creada). El mockup también muestra un link
 * "Editar" por tarjeta, pero la app no tiene edición in situ (ni en
 * escritorio); decisión explícita de la dueña: se omite en vez de
 * simularlo. */
export function DireccionesCliente({ direcciones }: { direcciones: AddressRow[] }) {
  const router = useRouter();
  const [mostrarForma, setMostrarForma] = useState(direcciones.length === 0);

  async function eliminar(id: string) {
    await borrarDireccion(id);
    router.refresh();
  }

  async function marcarDefault(id: string) {
    await marcarComoPredeterminada(id);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 }}>
      <div className="cuenta-escritorio-solo" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {direcciones.map((a) => (
          <div key={a.id} style={{ padding: 20, border: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <span style={{ display: "block", fontSize: 17, color: "var(--text-primary)" }}>{a.label}</span>
              <span style={{ display: "block", marginTop: 6, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
                {a.street} {a.ext_number}{a.int_number ? `, Int. ${a.int_number}` : ""}, Col. {a.neighborhood}, C.P. {a.postal_code}, {a.municipality}, {a.state} · Recibe {a.recipient_name}
              </span>
            </div>
            <button type="button" onClick={() => eliminar(a.id)} style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>

      <div className="cuenta-movil-solo" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {direcciones.map((a) => (
          <div key={a.id} style={{ padding: 16, border: `1px solid ${a.is_default ? "#3CE7FF" : "#1F3244"}`, background: "#0F1D2B" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ flex: 1, minWidth: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 16, color: "#EAF2F8" }}>{a.label}</span>
              <span
                style={{
                  flex: "0 0 auto",
                  padding: "4px 9px",
                  border: `1px solid ${a.is_default ? "#3CE7FF" : "#1F3244"}`,
                  fontFamily: "'IBM Plex Mono',monospace",
                  fontSize: 10.5,
                  color: a.is_default ? "#3CE7FF" : "#9FB2C3",
                }}
              >
                {a.is_default ? "Predeterminada" : "Alterna"}
              </span>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "#9FB2C3" }}>
              {a.street} {a.ext_number}{a.int_number ? `, Int. ${a.int_number}` : ""}, Col. {a.neighborhood}, C.P. {a.postal_code}, {a.municipality}, {a.state} · Recibe {a.recipient_name}
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {!a.is_default && (
                <button type="button" onClick={() => marcarDefault(a.id)} style={{ fontSize: 13.5, color: "#9FB2C3" }}>
                  Usar por defecto
                </button>
              )}
              <button type="button" onClick={() => eliminar(a.id)} style={{ fontSize: 13.5, color: "#9FB2C3" }}>
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarForma ? (
        <FormularioDireccion
          onGuardado={() => {
            setMostrarForma(false);
            router.refresh();
          }}
        />
      ) : (
        <>
          <Boton variante="secundaria" onClick={() => setMostrarForma(true)} className="cuenta-escritorio-solo" style={{ alignSelf: "flex-start" }}>
            Agregar dirección
          </Boton>
          <button
            type="button"
            onClick={() => setMostrarForma(true)}
            className="cuenta-movil-solo"
            style={{ width: "100%", padding: 14, border: "1px dashed #2C4560", color: "#3CE7FF", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14.5 }}
          >
            + Agregar dirección
          </button>
        </>
      )}
    </div>
  );
}
