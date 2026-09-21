import Link from "next/link";
import Image from "next/image";
import { FormularioServicio } from "@/components/organisms/FormularioServicio";

/** index.html:1453-1526 (`isServices`) — traducción literal: 3 tarjetas +
 * formulario inline en la misma pantalla (`servicesData`, index.html:1968-1971). */

const SERVICIOS = [
  { id: "monitoreo", img: "https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&w=800", name: "Monitoreo de alarmas 24/7", line: "Conectamos tu sistema a central de monitoreo, atendemos eventos y te enviamos reportes." },
  { id: "guardias", img: "https://images.pexels.com/photos/7388699/pexels-photo-7388699.jpeg?auto=compress&cs=tinysrgb&w=800", name: "Guardias de seguridad", line: "Guardias intramuros, control de acceso en recepción y rondines en turnos 12×12 y 24×24." },
  { id: "financiamiento", img: "https://images.pexels.com/photos/8470836/pexels-photo-8470836.jpeg?auto=compress&cs=tinysrgb&w=800", name: "Financiamiento y créditos", line: "Compra tu equipo a plazos de 3, 6 o 12 meses. Sujeto a aprobación." },
] as const;

export default function PaginaServicios() {
  return (
    <>
      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "48px 32px 0" }}>
        <h1 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(30px,3.4vw,48px)", lineHeight: 1.1, maxWidth: "22ch", color: "#EAF2F8" }}>
          Servicios de seguridad y financiamiento
        </h1>
        <p style={{ margin: "16px 0 0", maxWidth: "60ch", fontSize: 17, lineHeight: 1.55, color: "#9FB2C3" }}>
          Monitoreo, personal y crédito para que tu sistema no se quede a medias. Cotizamos en Querétaro y zonas cercanas.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18, marginTop: 34 }}>
          {SERVICIOS.map((sv) => (
            <div key={sv.id} style={{ background: "#0F1D2B", border: "1px solid #1F3244", display: "flex", flexDirection: "column" }}>
              <span style={{ display: "block", height: 190, position: "relative", background: "linear-gradient(160deg,#16303F,#0B1622 70%)", overflow: "hidden" }}>
                <Image src={sv.img} alt="" fill sizes="(max-width: 900px) 100vw, 33vw" style={{ objectFit: "cover", opacity: 0.6 }} />
              </span>
              <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <h2 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 21, lineHeight: 1.25, color: "#EAF2F8" }}>{sv.name}</h2>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "#9FB2C3", flex: 1 }}>{sv.line}</p>
                <Link
                  href={`/servicios/${sv.id}`}
                  style={{ alignSelf: "flex-start", padding: "12px 20px", border: "1px solid #3CE7FF", color: "#3CE7FF", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14.5 }}
                >
                  Ver el servicio
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 32px 90px" }}>
        <FormularioServicio />
      </section>
    </>
  );
}
