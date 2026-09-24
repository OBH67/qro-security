"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cerrarSesionStaffAction } from "@/server/actions/admin/auth";
import type { RolStaff } from "@/server/auth/roles";
import type { ContadoresPanel } from "@/server/db/queries/admin/panel";

/** panel-admin-maqueta.html:110-147 (sidebar) — traducción literal, salvo
 * el bloque "VISTA DE DEMOSTRACIÓN" (chips Admin/Inventario): esos chips
 * simulan cambiar de rol dentro de la propia maqueta para presentarla sin
 * dos cuentas reales — aquí el rol viene de la sesión real (H2), no hay
 * nada que "cambiar" con un botón. Omitido a propósito, no en silencio.
 *
 * `"use client"` (2026-09-23): se agregó el estado `abierto` para el
 * panel deslizable en móvil (< 860px, ver admin.css `.admin-sidebar`) —
 * se cierra solo al navegar porque este layout persiste entre rutas
 * (App Router) y un `<Link>` normal no lo desmonta; el cierre se ajusta
 * durante el render comparando `pathname` contra su valor anterior, no
 * en un `useEffect` (evita el doble render que dispara el lint). */

const NAV_CONFIG: { id: string; href: string; label: string; roles: RolStaff[] }[] = [
  { id: "tablero", href: "/admin", label: "Inicio", roles: ["admin"] },
  { id: "pedidos", href: "/admin/pedidos", label: "Pedidos", roles: ["admin"] },
  { id: "catalogo", href: "/admin/catalogo", label: "Catálogo", roles: ["admin", "inventario"] },
  { id: "devoluciones", href: "/admin/devoluciones", label: "Devoluciones", roles: ["admin"] },
  { id: "solicitudes", href: "/admin/solicitudes", label: "Solicitudes", roles: ["admin"] },
  { id: "analitica", href: "/admin/analitica", label: "Analítica", roles: ["admin"] },
  { id: "configuracion", href: "/admin/configuracion", label: "Configuración", roles: ["admin"] },
];

const ETIQUETA_ROL: Record<RolStaff, string> = { admin: "Administrador", inventario: "Inventario" };

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "SG";
}

export function SidebarAdmin({
  rutaActual,
  nombre,
  rol,
  contadores,
}: {
  rutaActual: string;
  nombre: string;
  rol: RolStaff;
  contadores: ContadoresPanel;
}) {
  const items = NAV_CONFIG.filter((n) => n.roles.includes(rol));
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [pathnameAnterior, setPathnameAnterior] = useState(pathname);
  if (pathname !== pathnameAnterior) {
    setPathnameAnterior(pathname);
    setAbierto(false);
  }

  const contadorPorId: Record<string, number> = {
    pedidos: contadores.comprobantesPorValidar,
    devoluciones: contadores.devolucionesPendientes,
    solicitudes: contadores.solicitudesNuevas,
  };

  return (
    <>
      <button type="button" className="admin-menutoggle" onClick={() => setAbierto(true)} aria-label="Abrir menú" aria-expanded={abierto}>
        ☰
      </button>
      {abierto && <div className="admin-sidebar-overlay visible" onClick={() => setAbierto(false)} />}
      <div className={`admin-sidebar${abierto ? " abierta" : ""}`}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-wash)", border: "1px solid var(--accent)", display: "grid", placeItems: "center", color: "var(--accent)", fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 12, flex: "0 0 auto" }}>
          SG
        </div>
        <div>
          <div className="title" style={{ fontSize: 15, lineHeight: 1.2 }}>
            Seguridad General
          </div>
          <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: "var(--text-muted)" }}>
            QUERÉTARO · PANEL
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto" }} aria-label="Navegación del panel">
        {items.map((item) => {
          const activo = item.href === "/admin" ? rutaActual === "/admin" : rutaActual.startsWith(item.href);
          const contador = contadorPorId[item.id] ?? 0;
          return (
            <Link key={item.id} href={item.href} className={`navitem${activo ? " activo" : ""}`}>
              <span style={{ flex: 1 }}>{item.label}</span>
              {contador > 0 && (
                <span className={`contador${item.id === "pedidos" ? " sg-pulse" : ""}`}>{contador}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--bg-hover)", border: "1px solid var(--border-strong)", display: "grid", placeItems: "center", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)", flex: "0 0 auto" }}>
          {iniciales(nombre)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{ETIQUETA_ROL[rol]}</div>
        </div>
      </div>
      <form action={cerrarSesionStaffAction}>
        <button type="submit" className="navitem" style={{ borderTop: "1px solid var(--border)", fontSize: 13 }}>
          Cerrar sesión
        </button>
      </form>
      </div>
    </>
  );
}
