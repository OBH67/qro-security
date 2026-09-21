import { redirect } from "next/navigation";
import Link from "next/link";
import { SitioConChrome } from "@/components/templates/SitioConChrome";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { cerrarSesion } from "@/server/actions/cuenta";

/** index.html:1201-1213 (`isAccount`, `acctNav`) — navegación de "Mi
 * cuenta". */
export default async function LayoutMiCuenta({ children }: { children: React.ReactNode }) {
  // El middleware (`src/middleware.ts`) ya redirige antes de llegar aquí;
  // esta segunda verificación es el mismo criterio de capas del panel
  // admin (§6.4): nunca se confía en que una sola capa ya filtró.
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/ingresar");

  const enlaces = [
    { href: "/mi-cuenta/pedidos", label: "Mis pedidos" },
    { href: "/mi-cuenta/datos", label: "Mis datos" },
    { href: "/mi-cuenta/direcciones", label: "Direcciones" },
    { href: "/mi-cuenta/datos-fiscales", label: "Datos de facturación" },
    { href: "/mi-cuenta/saldo", label: "Saldo a favor" },
    { href: "/mi-cuenta/devoluciones", label: "Devoluciones" },
  ];

  return (
    <SitioConChrome>
      <section
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "36px 20px 90px",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 40,
          alignItems: "start",
        }}
      >
        <aside style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16 }}>
              {sesion.perfil.first_name} {sesion.perfil.last_name}
            </span>
            <span style={{ display: "block", marginTop: 3, fontSize: 12.5, color: "var(--text-muted)" }}>{sesion.email}</span>
          </div>
          <nav style={{ display: "flex", flexDirection: "column" }}>
            {enlaces.map((e) => (
              <Link
                key={e.href}
                href={e.href}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 14.5, color: "var(--text-muted)" }}
              >
                {e.label}
              </Link>
            ))}
            <form action={cerrarSesion}>
              <button
                type="submit"
                style={{ display: "block", width: "100%", textAlign: "left", padding: "12px 16px", fontSize: 14.5, color: "var(--text-muted)" }}
              >
                Cerrar sesión
              </button>
            </form>
          </nav>
        </aside>
        <div>{children}</div>
      </section>
    </SitioConChrome>
  );
}
