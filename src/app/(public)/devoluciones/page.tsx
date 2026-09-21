import Link from "next/link";
import { obtenerFaqsPorAmbito } from "@/server/db/queries/catalogo";
import { obtenerPlazoDevolucionDias } from "@/server/db/queries/devoluciones";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { AcordeonFaqs } from "@/components/organisms/AcordeonFaqs";

/** index.html:1597-1644 (`isDev`) — traducción literal. El plazo (`[X]
 * días... dato por confirmar` en el demo) ya está resuelto: viene de
 * `settings.return_window_days` (PA-3, cerrada 2026-09-20: 30 días por
 * defecto, configurable desde H4). */

const TARJETAS = [
  { p: "100%", t: "Producto sellado de fábrica", d: "Se devuelve el 100% de su valor en saldo a favor para comprar productos.", c: "#45E39A" },
  { p: "70%", t: "Producto abierto o sin empaque", d: "Se devuelve el 70% de su valor en saldo a favor para comprar productos.", c: "#FFB547" },
] as const;

const PASOS = [
  { n: "01", t: "Solicita la devolución", d: "En Mi cuenta elige el pedido, el producto, la cantidad y el motivo. Agrega fotos." },
  { n: "02", t: "Un asesor la revisa", d: "Confirmamos el estado del producto y el porcentaje que aplica." },
  { n: "03", t: "Recibes tu saldo", d: "Abonamos el saldo a favor a tu cuenta para tu próxima compra." },
] as const;

export default async function PaginaDevoluciones() {
  const [faqs, plazoDias, sesion] = await Promise.all([obtenerFaqsPorAmbito("devoluciones"), obtenerPlazoDevolucionDias(), obtenerSesionActual()]);
  const hrefSolicitar = sesion ? "/mi-cuenta/devoluciones" : "/ingresar?siguiente=/mi-cuenta/devoluciones";

  return (
    <section style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px 90px" }}>
      <h1 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(28px,3.2vw,44px)", lineHeight: 1.1, color: "#EAF2F8" }}>
        Devoluciones y saldo a favor
      </h1>

      <div className="clip-corner-lg" style={{ marginTop: 28, padding: 26, border: "1px solid #3CE7FF", background: "rgba(60,231,255,.05)" }}>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: "#EAF2F8", maxWidth: "62ch" }}>
          Las devoluciones no se reembolsan en efectivo. El valor se devuelve como saldo a favor para comprar productos en la tienda.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 22 }}>
        {TARJETAS.map((c) => (
          <div key={c.t} className="clip-corner-lg" style={{ padding: 28, background: "#0F1D2B", border: `1px solid ${c.c}` }}>
            <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 46, lineHeight: 1, color: c.c }}>{c.p}</span>
            <h2 style={{ margin: "14px 0 8px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 20, lineHeight: 1.25, color: "#EAF2F8" }}>{c.t}</h2>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#9FB2C3" }}>{c.d}</p>
          </div>
        ))}
      </div>
      <p style={{ margin: "20px 0 0", fontSize: 15, color: "#9FB2C3" }}>Otros casos los revisa un asesor.</p>

      <div style={{ marginTop: 22, padding: 18, border: "1px solid #FFB547", background: "rgba(255,181,71,.06)", display: "flex", gap: 14, alignItems: "center" }}>
        <span style={{ width: 8, height: 8, background: "#FFB547", flex: "0 0 auto" }} />
        <p style={{ margin: 0, fontSize: 15, color: "#EAF2F8" }}>
          Plazo para solicitar: <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#FFB547" }}>{plazoDias}</span> días naturales después de recibir tu pedido.
        </p>
      </div>

      <h2 style={{ margin: "44px 0 18px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 26, color: "#EAF2F8" }}>Pasos para devolver</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
        {PASOS.map((st) => (
          <div key={st.n} style={{ padding: 22, background: "#0F1D2B", border: "1px solid #1F3244", borderTop: "2px solid #3CE7FF" }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#3CE7FF" }}>{st.n}</span>
            <h3 style={{ margin: "10px 0 8px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 18, lineHeight: 1.25, color: "#EAF2F8" }}>{st.t}</h3>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#9FB2C3" }}>{st.d}</p>
          </div>
        ))}
      </div>

      <Link
        href={hrefSolicitar}
        className="clip-corner-md"
        style={{ display: "inline-block", marginTop: 28, padding: "15px 26px", background: "#3CE7FF", color: "#07111C", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 16, boxShadow: "0 0 18px rgba(60,231,255,.35)" }}
      >
        Solicitar devolución
      </Link>

      <h2 style={{ margin: "50px 0 16px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 26, color: "#EAF2F8" }}>Preguntas frecuentes</h2>
      <AcordeonFaqs preguntas={faqs} />
    </section>
  );
}
