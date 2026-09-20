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

/** index.html:1814-1863 — pie de página. Los datos de contacto (dirección,
 * teléfono, correo, horario) son texto de demostración en `index.html`; se
 * dejan como placeholder explícito hasta que la dueña confirme los reales
 * (no están resueltos en `docs/contexto-negocio.md`, se marcan en el propio
 * texto para no presentar un dato falso como si fuera real). */
export function PiePagina({ grupos }: { grupos: GrupoConNavegacion[] }) {
  return (
    <footer style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)", marginTop: "auto" }}>
      <div
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "52px 32px 28px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 36,
        }}
      >
        <ColumnaFooter titulo="Productos">
          {grupos.map((g) => (
            <Link key={g.id} href={`/catalogo/${g.slug}`} style={{ textAlign: "left", fontSize: 14, color: "var(--text-muted)" }}>
              {g.name}
            </Link>
          ))}
        </ColumnaFooter>

        <ColumnaFooter titulo="Servicios">
          {SERVICIOS.map((sv) => (
            <Link key={sv.tipo} href={`/servicios/${sv.tipo}`} style={{ textAlign: "left", fontSize: 14, color: "var(--text-muted)" }}>
              {sv.nombre}
            </Link>
          ))}
        </ColumnaFooter>

        <ColumnaFooter titulo="Ayuda">
          {AYUDA.map((item) => (
            <Link key={item.href} href={item.href} style={{ textAlign: "left", fontSize: 14, color: "var(--text-muted)" }}>
              {item.nombre}
            </Link>
          ))}
        </ColumnaFooter>

        <div>
          <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>Contacto</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>
            <span>Dirección pendiente de confirmar</span>
            <span className="font-data">Teléfono pendiente de confirmar</span>
            <span>Correo pendiente de confirmar</span>
            <span>Lun a vie 9:00 a 18:00, sáb 9:00 a 14:00</span>
          </div>
        </div>
      </div>
      <div
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "18px 32px 40px",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 18,
          flexWrap: "wrap",
          justifyContent: "space-between",
          fontSize: 13,
          color: "var(--text-muted)",
        }}
      >
        <span>© {new Date().getFullYear()} Seguridad General Querétaro</span>
        <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ width: 6, height: 6, background: "var(--accent)" }} />
          Pagos por transferencia SPEI
        </span>
      </div>
    </footer>
  );
}

function ColumnaFooter({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 15 }}>{titulo}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>{children}</div>
    </div>
  );
}
