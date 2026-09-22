import { redirect } from "next/navigation";
import Link from "next/link";
import { SitioConChrome } from "@/components/templates/SitioConChrome";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { cerrarSesion } from "@/server/actions/cuenta";
import { obtenerPedidosDeCliente } from "@/server/db/queries/pedidos";
import { obtenerSaldoDisponible } from "@/server/db/queries/saldo";
import { formatearPrecio } from "@/lib/formato";
import { EncabezadoCuentaMovil } from "@/components/organisms/EncabezadoCuentaMovil";
import { TabsCuentaMovil } from "@/components/organisms/TabsCuentaMovil";

/** index.html:1201-1213 (`isAccount`, `acctNav`) — navegación de "Mi
 * cuenta". El bloque móvil (header + fila de usuario + tabs) traduce
 * literalmente el mockup `Panel_Usuario_Movil.dc.html` que la dueña
 * compartió: en escritorio no cambia nada (el `<aside>` de siempre sigue
 * ahí); en móvil ese `<aside>` se oculta y este bloque lo reemplaza por
 * completo — junto con la navbar del sitio, que ya se oculta aparte en
 * `EncabezadoSitio.tsx` para estas rutas. */
export default async function LayoutMiCuenta({ children }: { children: React.ReactNode }) {
  // El middleware (`src/middleware.ts`) ya redirige antes de llegar aquí;
  // esta segunda verificación es el mismo criterio de capas del panel
  // admin (§6.4): nunca se confía en que una sola capa ya filtró.
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/ingresar");

  const [pedidosPendientes, saldo] = await Promise.all([
    obtenerPedidosDeCliente(sesion.userId, "pendiente_pago"),
    obtenerSaldoDisponible(sesion.userId),
  ]);
  const iniciales = `${sesion.perfil.first_name?.[0] ?? ""}${sesion.perfil.last_name?.[0] ?? ""}`.toUpperCase();

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
      {/* Punto de quiebre 760px — el mismo que ya usa `EncabezadoSitio.tsx`
          (`esMovil: window.innerWidth < 760`) para que "móvil" signifique lo
          mismo en toda la sección. */}
      <style>{`
        .cuenta-movil-solo { display: none; }
        @media (max-width: 760px) {
          .cuenta-movil-solo { display: block; }
          .cuenta-escritorio-solo { display: none !important; }
          .cuenta-grid { grid-template-columns: 1fr !important; gap: 0 !important; padding: 0 !important; }
          .cuenta-contenido { padding: 16px 14px 34px !important; }
        }
      `}</style>

      <div className="cuenta-movil-solo">
        <EncabezadoCuentaMovil pedidosPendientes={pedidosPendientes.length} />
        <div style={{ display: "flex", gap: 13, alignItems: "center", padding: "16px 14px", borderBottom: "1px solid #16283A", background: "#0B1622" }}>
          <span
            style={{
              width: 46,
              height: 46,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              background: "#16283A",
              border: "1px solid #2C4560",
              fontFamily: "'IBM Plex Mono',monospace",
              fontSize: 15,
              color: "#3CE7FF",
            }}
          >
            {iniciales || "?"}
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 16.5, color: "#EAF2F8" }}>
              {sesion.perfil.first_name} {sesion.perfil.last_name}
            </span>
            <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: "#9FB2C3", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sesion.email}
            </span>
          </span>
          <span style={{ flex: "0 0 auto", padding: "6px 10px", border: "1px solid #45E39A", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: "#45E39A" }}>
            {formatearPrecio(saldo)}
          </span>
        </div>
        <TabsCuentaMovil />
      </div>

      <section
        className="cuenta-grid"
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
        <aside className="cuenta-escritorio-solo" style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
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
        <div className="cuenta-contenido">
          {children}
          <form action={cerrarSesion} className="cuenta-movil-solo">
            <button
              type="submit"
              style={{ width: "100%", marginTop: 26, padding: 15, border: "1px solid #1F3244", color: "#FF7A88", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15 }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </section>
    </SitioConChrome>
  );
}
