"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Traducción literal del mockup (`navTabs`, `Panel_Usuario_Movil.dc.html`)
 * — reemplaza al `<aside>` de escritorio en móvil: mismas 6 secciones, como
 * fila horizontal con scroll en vez de columna vertical. Solo se monta en
 * móvil (ver `layout.tsx`). */

const TABS = [
  { href: "/mi-cuenta/pedidos", label: "Pedidos" },
  { href: "/mi-cuenta/datos", label: "Mis datos" },
  { href: "/mi-cuenta/direcciones", label: "Direcciones" },
  { href: "/mi-cuenta/datos-fiscales", label: "Facturación" },
  { href: "/mi-cuenta/saldo", label: "Saldo" },
  { href: "/mi-cuenta/devoluciones", label: "Devoluciones" },
] as const;

export function TabsCuentaMovil() {
  const pathname = usePathname();

  return (
    <div style={{ display: "flex", gap: 8, padding: "12px 14px", overflowX: "auto", borderBottom: "1px solid #16283A" }}>
      {TABS.map((t) => {
        const activo = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            style={{
              flex: "0 0 auto",
              minHeight: 40,
              padding: "9px 15px",
              whiteSpace: "nowrap",
              fontFamily: "'Chakra Petch',sans-serif",
              fontWeight: 500,
              fontSize: 14.5,
              border: `1px solid ${activo ? "#3CE7FF" : "#1F3244"}`,
              background: activo ? "rgba(60,231,255,.12)" : "transparent",
              color: activo ? "#3CE7FF" : "#9FB2C3",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
