import Link from "next/link";

/** index.html:1645-1669 — traducción literal, valores hex del demo (no
 * tokens de `globals.css` — misma regla que `EncabezadoSitio.tsx`, ver su
 * comentario de cabecera). Los 4 pasos (`comoSteps`, index.html:2522-2527)
 * son contenido fijo del demo, no datos de una tabla. */

const PASOS = [
  { n: "01", t: "Crea tu cuenta", d: "Datos de contacto, dirección de envío y, si quieres factura, tus datos fiscales." },
  { n: "02", t: "Genera tu pedido", d: "Arma tu carrito, elige dirección y confirma. El pago es por transferencia SPEI." },
  { n: "03", t: "Transfiere y sube tu comprobante", d: "Te mostramos CLABE, concepto e importe exacto. Sube la captura en Mis pedidos." },
  { n: "04", t: "Un asesor te contacta", d: "En menos de 24 horas confirmamos tu pago, el envío y la fecha de entrega." },
] as const;

export default function PaginaComoComprar() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 32px 90px" }}>
      <h1 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(28px,3.2vw,44px)", lineHeight: 1.1, color: "#EAF2F8" }}>
        Cómo comprar
      </h1>
      <p style={{ margin: "16px 0 0", maxWidth: "62ch", fontSize: 17, lineHeight: 1.55, color: "#9FB2C3" }}>
        Cuatro pasos. El pago es por transferencia o depósito SPEI y tu pedido se confirma cuando subes el comprobante.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 36 }}>
        {PASOS.map((st) => (
          <div
            key={st.n}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
              alignItems: "center",
              padding: 22,
              background: "#0F1D2B",
              border: "1px solid #1F3244",
            }}
          >
            <div>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#3CE7FF" }}>{st.n}</span>
              <h2 style={{ margin: "10px 0 8px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 22, lineHeight: 1.25, color: "#EAF2F8" }}>
                {st.t}
              </h2>
              <p style={{ margin: 0, maxWidth: "52ch", fontSize: 15, lineHeight: 1.6, color: "#9FB2C3" }}>{st.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
        <Link
          href="/catalogo"
          className="clip-corner-md"
          style={{
            padding: "15px 26px",
            background: "#3CE7FF",
            color: "#07111C",
            fontFamily: "'Chakra Petch',sans-serif",
            fontWeight: 600,
            fontSize: 16,
            boxShadow: "0 0 18px rgba(60,231,255,.35)",
          }}
        >
          Ver catálogo
        </Link>
        <Link
          href="/preguntas-frecuentes"
          style={{ padding: "15px 26px", border: "1px solid #1F3244", color: "#EAF2F8", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 16 }}
        >
          Preguntas frecuentes
        </Link>
      </div>
    </section>
  );
}
