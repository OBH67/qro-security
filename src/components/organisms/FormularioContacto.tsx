"use client";

import { useState } from "react";

/**
 * index.html:1694-1719 — el formulario "Escríbenos" del demo. Ningún
 * documento de negocio (`requerimientos.md`, `modelo-datos.md`) modela un
 * mensaje de contacto general como recurso propio — E1 (leads de
 * servicio) sí tiene su tabla (`service_requests`) porque son 3 tipos
 * específicos con datos de cotización; esto es un contacto genérico sin
 * tabla equivalente. El propio demo tampoco lo persiste en ningún lado
 * (`sendSrv` solo pone una bandera en memoria) — se traduce igual de
 * honesto: confirma en pantalla, sin inventar un backend que no está
 * modelado. Documentado aquí en vez de omitido en silencio.
 */
export function FormularioContacto() {
  const [enviado, setEnviado] = useState(false);

  if (enviado) {
    return (
      <p style={{ margin: "16px 0 0", fontSize: 15, color: "#45E39A" }}>
        Recibimos tu mensaje. Un asesor te contactará en menos de 24 horas.
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setEnviado(true);
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#9FB2C3", marginBottom: 6 }}>Nombre</label>
          <input
            required
            placeholder="Mariana López Ríos"
            style={{ width: "100%", padding: "12px 14px", background: "#0B1622", border: "1px solid #1F3244", borderRadius: 4, fontSize: 15, color: "#EAF2F8" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13, color: "#9FB2C3", marginBottom: 6 }}>Teléfono</label>
          <input
            required
            placeholder="442 000 0000"
            style={{ width: "100%", padding: "12px 14px", background: "#0B1622", border: "1px solid #1F3244", borderRadius: 4, fontSize: 15, color: "#EAF2F8" }}
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 13, color: "#9FB2C3", marginBottom: 6 }}>Correo</label>
          <input
            required
            type="email"
            placeholder="mariana.lopez@correo.com"
            style={{ width: "100%", padding: "12px 14px", background: "#0B1622", border: "1px solid #1F3244", borderRadius: 4, fontSize: 15, color: "#EAF2F8" }}
          />
        </div>
        <div style={{ gridColumn: "span 2" }}>
          <label style={{ display: "block", fontSize: 13, color: "#9FB2C3", marginBottom: 6 }}>Mensaje</label>
          <textarea
            required
            rows={4}
            placeholder="Cuéntanos qué necesitas"
            style={{ width: "100%", padding: "12px 14px", background: "#0B1622", border: "1px solid #1F3244", borderRadius: 4, fontSize: 15, color: "#EAF2F8", resize: "vertical" }}
          />
        </div>
      </div>
      <button
        type="submit"
        className="clip-corner-md"
        style={{
          marginTop: 22,
          padding: "15px 26px",
          background: "#3CE7FF",
          color: "#07111C",
          fontFamily: "'Chakra Petch',sans-serif",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "0 0 18px rgba(60,231,255,.35)",
        }}
      >
        Enviar mensaje
      </button>
    </form>
  );
}
