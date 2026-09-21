import Link from "next/link";
import type { GrupoConNavegacion } from "@/server/db/queries/catalogo";

const SERVICIOS = [
  { tipo: "monitoreo", nombre: "Monitoreo de alarmas 24/7" },
  { tipo: "guardias", nombre: "Guardias de seguridad" },
  { tipo: "financiamiento", nombre: "Financiamiento y créditos" },
] as const;

const AYUDA = [
  { href: "/como-comprar", nombre: "Cómo comprar" },
  { href: "/devoluciones", nombre: "Devoluciones" },
  { href: "/preguntas-frecuentes", nombre: "Preguntas frecuentes" },
  { href: "/legal/privacidad", nombre: "Aviso de privacidad" },
  { href: "/legal/terminos", nombre: "Términos y condiciones" },
  { href: "/contacto", nombre: "Nosotros y contacto" },
] as const;

/**
 * index.html:1814-1858 — pie de página, traducción literal (colores y
 * medidas exactos del demo, no tokens de `globals.css` — ver la misma nota
 * en `EncabezadoSitio.tsx`). Los datos de contacto (dirección, teléfono,
 * correo, horario) son texto de demostración en el propio `index.html`; se
 * mantienen igual que el demo hasta que la dueña confirme los reales (no
 * resueltos en `docs/contexto-negocio.md`) — no se presentan como un dato
 * de negocio distinto al que ya aprobó, solo se copian.
 *
 * Los dos enlaces "(demo)" del pie de `index.html` (`goSearchDemo`,
 * `go404`, línea 1854-1855) no se tradujeron: son atajos para forzar
 * pantallas de la SPA durante la presentación (una búsqueda sin
 * resultados, la 404), no una función real del negocio — el equivalente
 * real (búsqueda sin resultados de A2.4, la página 404 real) ya existe en
 * el sitio, solo no como enlaces de "modo demo" en el pie. Documentado
 * para que quede explícito, no omitido en silencio.
 */
export function PiePagina({ grupos }: { grupos: GrupoConNavegacion[] }) {
  return (
    <footer style={{ borderTop: "1px solid #1F3244", background: "#0B1622", marginTop: "auto" }}>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "52px 32px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 36,
        }}
      >
        <ColumnaFooter titulo="Productos">
          {grupos.map((g) => (
            <Link key={g.id} href={`/catalogo/${g.slug}`} style={{ textAlign: "left", fontSize: 14, color: "#9FB2C3" }}>
              {g.name}
            </Link>
          ))}
        </ColumnaFooter>

        <ColumnaFooter titulo="Servicios">
          {SERVICIOS.map((sv) => (
            <Link key={sv.tipo} href={`/servicios/${sv.tipo}`} style={{ textAlign: "left", fontSize: 14, color: "#9FB2C3" }}>
              {sv.nombre}
            </Link>
          ))}
        </ColumnaFooter>

        <ColumnaFooter titulo="Ayuda">
          {AYUDA.map((item) => (
            <Link key={item.href} href={item.href} style={{ textAlign: "left", fontSize: 14, color: "#9FB2C3" }}>
              {item.nombre}
            </Link>
          ))}
        </ColumnaFooter>

        <div>
          <h3 style={{ margin: "0 0 14px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 15, color: "#EAF2F8" }}>Contacto</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14, color: "#9FB2C3", lineHeight: 1.5 }}>
            <span>
              Av. Ejemplo 123, Col. Centro
              <br />
              C.P. 76000, Querétaro, Qro.
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace" }}>442 000 0000</span>
            <span>ventas@sgqueretaro.demo</span>
            <span>
              Lun a vie 9:00 a 18:00
              <br />
              Sáb 9:00 a 14:00
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "18px 32px 40px",
          borderTop: "1px solid #1F3244",
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "space-between",
          fontSize: 13,
          color: "#9FB2C3",
        }}
      >
        <span>© {new Date().getFullYear()} Seguridad General Querétaro</span>
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ width: 6, height: 6, background: "#3CE7FF" }} />
          Pagos por transferencia SPEI
        </span>
      </div>
    </footer>
  );
}

function ColumnaFooter({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ margin: "0 0 14px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 15, color: "#EAF2F8" }}>{titulo}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{children}</div>
    </div>
  );
}
