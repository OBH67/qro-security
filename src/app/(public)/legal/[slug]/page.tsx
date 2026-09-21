import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerPaginaLegal } from "@/server/db/queries/contenido";
import type { LegalPageRow } from "@/types/database";

/** index.html:1747-1765 (`isLegal`) — traducción literal de la estructura
 * (tabs + título + secciones numeradas). El contenido real (`legal_pages`,
 * 0006) lo escribe la dueña desde el panel admin (H4, fuera de este
 * incremento); el seed solo siembra la MISMA estructura de secciones que
 * ya traía el demo con su propio aviso "texto de relleno para el demo" —
 * no se inventa redacción legal real. `body` se guarda como texto con
 * encabezados `## ` (mini-markdown, sin librería nueva) que esta página
 * parte en secciones. */

const TABS = [
  { slug: "privacidad", label: "Aviso de privacidad" },
  { slug: "terminos", label: "Términos y condiciones" },
] as const;

function parsearSecciones(body: string): { titulo: string; texto: string }[] {
  return body
    .split(/\n(?=## )/)
    .map((bloque) => bloque.trim())
    .filter(Boolean)
    .map((bloque) => {
      const [primeraLinea, ...resto] = bloque.split("\n");
      return { titulo: primeraLinea.replace(/^##\s*/, ""), texto: resto.join(" ").trim() };
    });
}

export default async function PaginaLegal({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== "privacidad" && slug !== "terminos") notFound();

  const pagina = await obtenerPaginaLegal(slug as LegalPageRow["slug"]);
  if (!pagina) notFound();

  const secciones = parsearSecciones(pagina.body);

  return (
    <section style={{ maxWidth: 860, margin: "0 auto", padding: "48px 32px 90px" }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
        {TABS.map((t) => (
          <Link
            key={t.slug}
            href={`/legal/${t.slug}`}
            style={{
              padding: "12px 18px",
              fontFamily: "'Chakra Petch',sans-serif",
              fontWeight: 500,
              fontSize: 15,
              border: `1px solid ${t.slug === slug ? "#3CE7FF" : "#1F3244"}`,
              color: t.slug === slug ? "#3CE7FF" : "#9FB2C3",
            }}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <h1 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,3vw,38px)", color: "#EAF2F8" }}>{pagina.title}</h1>
      <p style={{ margin: "12px 0 0", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#9FB2C3" }}>
        ÚLTIMA ACTUALIZACIÓN · {new Date(pagina.updated_at).toLocaleDateString("es-MX", { year: "numeric", month: "long" }).toUpperCase()}
      </p>

      <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 28 }}>
        {secciones.map((sec, i) => (
          <div key={i}>
            <h2 style={{ margin: "0 0 10px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 20, color: "#EAF2F8" }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: "#3CE7FF", fontSize: 16 }}>{i + 1}.</span> {sec.titulo}
            </h2>
            <p style={{ margin: 0, maxWidth: "70ch", fontSize: 15.5, lineHeight: 1.7, color: "#9FB2C3" }}>{sec.texto}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
