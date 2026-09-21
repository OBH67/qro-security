import Link from "next/link";
import { FormularioContacto } from "@/components/organisms/FormularioContacto";

/** index.html:1671-1721 — traducción literal. Los datos de contacto
 * (dirección, teléfono, correo, horario) son texto de demostración en el
 * propio `index.html`, igual que ya documenta `PiePagina.tsx` — se
 * mantienen iguales al demo hasta que la dueña confirme los reales. */

const SECTORES = ["Hogar", "Comercio", "Hotelería", "Industria", "Flotillas"] as const;

export default function PaginaContacto() {
  return (
    <section style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 32px 90px" }}>
      <h1 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(28px,3.2vw,44px)", lineHeight: 1.1, color: "#EAF2F8" }}>
        Nosotros y contacto
      </h1>
      <p style={{ margin: "16px 0 0", maxWidth: "64ch", fontSize: 17, lineHeight: 1.55, color: "#9FB2C3" }}>
        Somos distribuidores de equipo de seguridad electrónica y tecnología en Querétaro. Atendemos a instaladores, negocios, industria y particulares.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        {SECTORES.map((s) => (
          <Link
            key={s}
            href="/catalogo/videovigilancia/todos"
            style={{ padding: "10px 18px", border: "1px solid #1F3244", background: "#0F1D2B", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15, color: "#9FB2C3" }}
          >
            {s}
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, marginTop: 40, alignItems: "start" }}>
        <div>
          <div
            style={{
              position: "relative",
              aspectRatio: "4/3",
              border: "1px solid #1F3244",
              background: "#0B1622",
              backgroundImage: "linear-gradient(#12212F 1px,transparent 1px),linear-gradient(90deg,#12212F 1px,transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          >
            <span style={{ position: "absolute", left: "46%", top: "44%", width: 14, height: 14, borderRadius: "50%", background: "#3CE7FF", boxShadow: "0 0 20px rgba(60,231,255,.8)" }} />
            <span style={{ position: "absolute", left: "46%", top: "44%", width: 56, height: 56, border: "1px solid rgba(60,231,255,.4)", borderRadius: "50%", transform: "translate(-21px,-21px)" }} />
            <span style={{ position: "absolute", bottom: 12, left: 14, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10.5, color: "#5D7080" }}>
              MAPA ESTILIZADO · SUCURSAL QUERÉTARO
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20, marginTop: 22 }}>
            <div>
              <span style={{ display: "block", fontSize: 13, color: "#9FB2C3" }}>Dirección</span>
              <span style={{ display: "block", marginTop: 5, fontSize: 15, lineHeight: 1.5, color: "#EAF2F8" }}>
                Av. Ejemplo 123, Col. Centro
                <br />
                C.P. 76000, Querétaro, Qro.
              </span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: 13, color: "#9FB2C3" }}>Teléfono y WhatsApp</span>
              <span style={{ display: "block", marginTop: 5, fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: "#EAF2F8" }}>442 000 0000</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: 13, color: "#9FB2C3" }}>Correo</span>
              <span style={{ display: "block", marginTop: 5, fontSize: 15, color: "#EAF2F8" }}>ventas@sgqueretaro.demo</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: 13, color: "#9FB2C3" }}>Horario</span>
              <span style={{ display: "block", marginTop: 5, fontSize: 15, lineHeight: 1.5, color: "#EAF2F8" }}>
                Lun a vie 9:00 a 18:00
                <br />
                Sáb 9:00 a 14:00
              </span>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ margin: "0 0 20px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 24, color: "#EAF2F8" }}>Escríbenos</h2>
          <FormularioContacto />
        </div>
      </div>
    </section>
  );
}
