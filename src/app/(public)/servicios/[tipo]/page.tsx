import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { obtenerFaqsPorAmbito } from "@/server/db/queries/catalogo";
import { AcordeonFaqs } from "@/components/organisms/AcordeonFaqs";
import type { TipoServicio } from "@/types/database";

/** index.html:1528-1595 (`isService`) — traducción literal de
 * `srvDetail`/`srvDetailData` (index.html:2426-2459). */

const DETALLE: Record<TipoServicio, { name: string; line: string; img: string; includes: string[]; steps: { n: string; t: string; d: string }[]; packages: { n: string; d: string }[]; cta: string }> = {
  monitoreo: {
    name: "Monitoreo de alarmas 24/7",
    line: "Conectamos tu sistema a central de monitoreo, atendemos cada evento y te entregamos reportes.",
    img: "https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&w=1400",
    includes: ["Conexión de tu panel a la central", "Atención de eventos las 24 horas", "Aviso a contactos y autoridades", "Reporte mensual de eventos"],
    steps: [
      { n: "01", t: "Revisamos tu sistema", d: "Un técnico verifica tu panel y la comunicación." },
      { n: "02", t: "Conectamos a la central", d: "Damos de alta tus zonas y contactos." },
      { n: "03", t: "Monitoreamos", d: "Atendemos cada señal y te avisamos." },
    ],
    packages: [
      { n: "Hogar", d: "Casa habitación con panel de alarma y hasta 8 zonas." },
      { n: "Negocio", d: "Local o sucursal con alarma, cámaras y control de acceso." },
      { n: "Empresa", d: "Varios sitios, reportes consolidados y atención dedicada." },
    ],
    cta: "Solicitar cotización",
  },
  guardias: {
    name: "Guardias de seguridad",
    line: "Guardias intramuros, control de acceso en recepción y rondines, en turnos 12×12 y 24×24.",
    img: "https://images.pexels.com/photos/7388699/pexels-photo-7388699.jpeg?auto=compress&cs=tinysrgb&w=1400",
    includes: ["Guardia intramuros con uniforme", "Control de acceso y bitácora en recepción", "Rondines con reporte fotográfico", "Supervisión y relevos"],
    steps: [
      { n: "01", t: "Visitamos el sitio", d: "Definimos puestos, turnos y consignas." },
      { n: "02", t: "Asignamos personal", d: "Perfil según el tipo de inmueble." },
      { n: "03", t: "Supervisamos", d: "Reportes y rondines verificados." },
    ],
    packages: [
      { n: "12×12", d: "Cobertura diurna o nocturna, doce horas por turno." },
      { n: "24×24", d: "Cobertura continua con relevo cada 24 horas." },
      { n: "Eventos", d: "Cobertura temporal para eventos y obras." },
    ],
    cta: "Cotizar guardias",
  },
  financiamiento: {
    name: "Financiamiento y créditos",
    line: "Compra tu equipo a plazos de 3, 6 o 12 meses. Sujeto a aprobación.",
    img: "https://images.pexels.com/photos/8470836/pexels-photo-8470836.jpeg?auto=compress&cs=tinysrgb&w=1400",
    includes: ["Plazos de 3, 6 y 12 meses", "Para negocios y particulares", "Respuesta en 48 horas hábiles", "Sujeto a aprobación"],
    steps: [
      { n: "01", t: "Envías tu solicitud", d: "Con el monto aproximado y el plazo deseado." },
      { n: "02", t: "Revisamos tu perfil", d: "Te pedimos documentación básica." },
      { n: "03", t: "Firmas y recibes", d: "Programamos la entrega del equipo." },
    ],
    packages: [
      { n: "3 meses", d: "Ideal para equipo de reposición. Plazo ilustrativo." },
      { n: "6 meses", d: "Para ampliar un sistema existente. Plazo ilustrativo." },
      { n: "12 meses", d: "Para proyectos completos. Plazo ilustrativo." },
    ],
    cta: "Solicitar financiamiento",
  },
};

export default async function PaginaServicioDetalle({ params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (tipo !== "monitoreo" && tipo !== "guardias" && tipo !== "financiamiento") notFound();

  const detalle = DETALLE[tipo];
  const faqs = await obtenerFaqsPorAmbito("servicios");

  return (
    <>
      <section style={{ position: "relative", borderBottom: "1px solid #1F3244" }}>
        <div style={{ height: 300, position: "relative", background: "linear-gradient(160deg,#16303F,#0B1622 70%)", overflow: "hidden" }}>
          <Image src={detalle.img} alt="" fill sizes="100vw" style={{ objectFit: "cover", opacity: 0.6 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(7,17,28,.92),rgba(7,17,28,.35))" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 32px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <Link href="/servicios" style={{ alignSelf: "flex-start", fontSize: 13.5, color: "#9FB2C3", marginBottom: 14 }}>
                Volver a Servicios
              </Link>
              <h1 style={{ margin: 0, maxWidth: "20ch", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(28px,3.2vw,44px)", lineHeight: 1.1, color: "#EAF2F8" }}>
                {detalle.name}
              </h1>
              <p style={{ margin: "14px 0 0", maxWidth: "58ch", fontSize: 17, lineHeight: 1.55, color: "#9FB2C3" }}>{detalle.line}</p>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "52px 32px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 40 }}>
        <div>
          <h2 style={{ margin: "0 0 16px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 24, color: "#EAF2F8" }}>Qué incluye</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {detalle.includes.map((i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 15.5, lineHeight: 1.55, color: "#9FB2C3" }}>
                <span style={{ width: 6, height: 6, background: "#3CE7FF", marginTop: 8, flex: "0 0 auto" }} />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 style={{ margin: "0 0 16px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 24, color: "#EAF2F8" }}>Cómo funciona</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {detalle.steps.map((st) => (
              <div key={st.n} style={{ padding: 18, background: "#0F1D2B", border: "1px solid #1F3244", borderLeft: "2px solid #3CE7FF" }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#3CE7FF" }}>{st.n}</span>
                <h3 style={{ margin: "8px 0 6px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 17, color: "#EAF2F8" }}>{st.t}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#9FB2C3" }}>{st.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "52px 32px 0" }}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 24, color: "#EAF2F8" }}>Para quién es</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {detalle.packages.map((p) => (
            <div key={p.n} className="clip-corner-md" style={{ padding: 24, background: "#0F1D2B", border: "1px solid #1F3244", display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 20, color: "#EAF2F8" }}>{p.n}</h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "#9FB2C3", flex: 1 }}>{p.d}</p>
              <Link href="/servicios" style={{ alignSelf: "flex-start", padding: "11px 18px", border: "1px solid #3CE7FF", color: "#3CE7FF", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14 }}>
                {detalle.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "52px 32px 90px" }}>
        <h2 style={{ margin: "0 0 18px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 24, color: "#EAF2F8" }}>Preguntas frecuentes</h2>
        <AcordeonFaqs preguntas={faqs} />
        <Link
          href="/servicios"
          className="clip-corner-md"
          style={{ display: "inline-block", marginTop: 28, padding: "15px 26px", background: "#3CE7FF", color: "#07111C", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 16, boxShadow: "0 0 18px rgba(60,231,255,.35)" }}
        >
          {detalle.cta}
        </Link>
      </section>
    </>
  );
}
