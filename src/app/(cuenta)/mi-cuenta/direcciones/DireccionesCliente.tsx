"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { borrarDireccion } from "@/server/actions/direcciones";
import { FormularioDireccion } from "@/components/organisms/FormularioDireccion";
import { Boton } from "@/components/atoms/Boton";
import type { AddressRow } from "@/types/database";

/** index.html:1263-1273 (`secDirecciones`) — B3.1. */
export function DireccionesCliente({ direcciones }: { direcciones: AddressRow[] }) {
  const router = useRouter();
  const [mostrarForma, setMostrarForma] = useState(direcciones.length === 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 }}>
      {direcciones.map((a) => (
        <div key={a.id} style={{ padding: 20, border: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", gap: 16, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <span style={{ display: "block", fontSize: 17, color: "var(--text-primary)" }}>{a.label}</span>
            <span style={{ display: "block", marginTop: 6, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
              {a.street} {a.ext_number}{a.int_number ? `, Int. ${a.int_number}` : ""}, Col. {a.neighborhood}, C.P. {a.postal_code}, {a.municipality}, {a.state} · Recibe {a.recipient_name}
            </span>
          </div>
          <button
            type="button"
            onClick={async () => {
              await borrarDireccion(a.id);
              router.refresh();
            }}
            style={{ fontSize: 13.5, color: "var(--text-muted)" }}
          >
            Eliminar
          </button>
        </div>
      ))}

      {mostrarForma ? (
        <FormularioDireccion
          onGuardado={() => {
            setMostrarForma(false);
            router.refresh();
          }}
        />
      ) : (
        <Boton variante="secundaria" onClick={() => setMostrarForma(true)} style={{ alignSelf: "flex-start" }}>
          Agregar dirección
        </Boton>
      )}
    </div>
  );
}
