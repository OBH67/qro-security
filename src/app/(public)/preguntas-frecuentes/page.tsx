import { obtenerFaqsPorAmbito } from "@/server/db/queries/catalogo";
import { FaqsPorTema } from "@/components/organisms/FaqsPorTema";

/** index.html:1723-1745 (`isFaq`) — traducción literal. */
export default async function PaginaPreguntasFrecuentes() {
  const preguntas = await obtenerFaqsPorAmbito("general");

  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "48px 32px 90px" }}>
      <h1 style={{ margin: "0 0 34px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(28px,3.2vw,44px)", color: "#EAF2F8" }}>
        Preguntas frecuentes
      </h1>
      <FaqsPorTema preguntas={preguntas} />
    </section>
  );
}
