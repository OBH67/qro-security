"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Traducción literal del mockup `Panel_Usuario_Movil.dc.html` (header:
 * botón volver + título dinámico + acceso rápido a "Mis pedidos" con
 * contador). Valores exactos del mockup (colores, tamaños) — mismo criterio
 * que `EncabezadoSitio.tsx` para traducir un diseño ya aprobado: no se
 * sustituyen por tokens de `globals.css` aunque coincidan. Solo se monta en
 * móvil, dentro de `/mi-cuenta` (ver `layout.tsx`); en escritorio no existe. */

const TITULOS_SECCION: Record<string, string> = {
  pedidos: "Mis pedidos",
  datos: "Mis datos",
  direcciones: "Direcciones",
  "datos-fiscales": "Datos de facturación",
  saldo: "Saldo a favor",
  devoluciones: "Devoluciones",
};

function datosEncabezado(pathname: string): { titulo: string; hrefVolver: string } {
  const [, seccion, ...resto] = pathname.split("/").filter(Boolean); // ["mi-cuenta", seccion, ...resto]

  if (seccion === "pedidos") {
    const [folio, sub] = resto;
    if (folio && sub === "comprobante") {
      return { titulo: "Subir comprobante", hrefVolver: `/mi-cuenta/pedidos/${folio}` };
    }
    if (folio) return { titulo: `Pedido ${folio}`, hrefVolver: "/mi-cuenta/pedidos" };
    return { titulo: "Mis pedidos", hrefVolver: "/" };
  }
  if (seccion === "devoluciones" && resto[0] === "nueva") {
    return { titulo: "Solicitar devolución", hrefVolver: "/mi-cuenta/devoluciones" };
  }
  return { titulo: TITULOS_SECCION[seccion] ?? "Mi cuenta", hrefVolver: "/" };
}

export function EncabezadoCuentaMovil({ pedidosPendientes }: { pedidosPendientes: number }) {
  const pathname = usePathname();
  const { titulo, hrefVolver } = datosEncabezado(pathname);

  return (
    <header
      style={{ position: "sticky", top: 0, zIndex: 40, background: "#07111CF2", backdropFilter: "blur(10px)", borderBottom: "1px solid #16283A" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px" }}>
        <Link
          href={hrefVolver}
          aria-label="Volver"
          style={{ width: 40, height: 40, flex: "0 0 auto", display: "grid", placeItems: "center", border: "1px solid #1F3244", color: "#EAF2F8" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 18, height: 18 }}>
            <path d="m14 6-6 6 6 6" />
          </svg>
        </Link>
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: "'Chakra Petch',sans-serif",
            fontWeight: 600,
            fontSize: 18,
            letterSpacing: "-.2px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {titulo}
        </span>
        <Link
          href="/mi-cuenta/pedidos"
          aria-label={`Mis pedidos, ${pedidosPendientes} pendientes`}
          className="clip-corner-sm"
          style={{ display: "flex", gap: 7, alignItems: "center", padding: "9px 12px", background: "#3CE7FF", color: "#07111C", flex: "0 0 auto" }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ width: 18, height: 18 }}>
            <path d="M4 5h2.2l2.3 10.2h9.1L20 8H7" />
            <circle cx="10" cy="19" r="1.4" />
            <circle cx="17.5" cy="19" r="1.4" />
          </svg>
          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 500 }}>{pedidosPendientes}</span>
        </Link>
      </div>
    </header>
  );
}
