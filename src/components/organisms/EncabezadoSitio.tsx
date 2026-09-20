"use client";

import { useState } from "react";
import Link from "next/link";
import type { GrupoConNavegacion } from "@/server/db/queries/catalogo";

/**
 * index.html:39-271 — encabezado del sitio (logo, buscador, cuenta,
 * pedido, mega-menú de "Productos" y menú de pantalla completa en móvil).
 * Simplificaciones deliberadas frente al demo, documentadas en
 * `.devsquad/estado.md` porque son decorativas y no afectan A1-A4:
 * - Sin la barra flotante que reaparece al hacer scroll hacia arriba.
 * - Sin el fondo con degradado que en el demo cambia según el slide del
 *   hero de la portada (aquí el encabezado es el mismo en todas las
 *   páginas, incluida la portada).
 * - El mega-menú no incluye el panel "DESTACADO" con un producto del
 *   grupo en hover (requeriría datos adicionales por grupo sin ganancia
 *   funcional para A1-A4).
 *
 * El icono de "Mi pedido" y "Mi cuenta" navegan a rutas que **todavía no
 * existen** (Épica B, carrito y cuenta — siguiente incremento). Es
 * intencional: no se inventa un carrito para este incremento.
 */

const SERVICIOS = [
  { tipo: "monitoreo", nombre: "Monitoreo de alarmas 24/7", linea: "Conectamos tu sistema a central de monitoreo y atendemos eventos." },
  { tipo: "guardias", nombre: "Guardias de seguridad", linea: "Guardias intramuros, control de acceso y rondines." },
  { tipo: "financiamiento", nombre: "Financiamiento y créditos", linea: "Compra tu equipo a plazos de 3, 6 o 12 meses." },
] as const;

export function EncabezadoSitio({ grupos }: { grupos: GrupoConNavegacion[] }) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [grupoMovil, setGrupoMovil] = useState<GrupoConNavegacion | null>(null);
  const [megaAbierto, setMegaAbierto] = useState(false);
  const [servAbierto, setServAbierto] = useState(false);
  const [grupoMega, setGrupoMega] = useState(grupos[0]?.id ?? "");

  const grupoActivoMega = grupos.find((g) => g.id === grupoMega) ?? grupos[0];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--bg-base)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        style={{
          maxWidth: "var(--content-max-width)",
          margin: "0 auto",
          padding: "12px 20px",
          display: "flex",
          gap: 18,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => {
            setMenuMovilAbierto(true);
            setGrupoMovil(null);
          }}
          style={{
            width: 44,
            height: 44,
            display: "none",
            placeItems: "center",
            border: "1px solid var(--border)",
            flex: "0 0 auto",
          }}
          className="header-menu-boton-movil"
        >
          <IconoMenu />
        </button>

        <Link href="/" style={{ display: "flex", gap: 12, alignItems: "center", flex: "0 0 auto" }}>
          <span
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              color: "var(--accent)",
            }}
          >
            SGQ
          </span>
          <span style={{ textAlign: "left", lineHeight: 1.05 }}>
            <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>
              Seguridad General
            </span>
            <span style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 2, color: "var(--text-muted)" }}>
              QUERÉTARO
            </span>
          </span>
        </Link>

        <form action="/buscar" method="GET" style={{ position: "relative", flex: "1 1 240px", minWidth: 160 }}>
          <input
            type="search"
            name="q"
            placeholder="Busca por producto, marca o SKU"
            aria-label="Buscar"
            style={{
              width: "100%",
              padding: "11px 14px",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-input)",
              borderRadius: "var(--radius-input)",
              color: "var(--text-primary)",
              fontSize: 15,
            }}
          />
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto", flex: "0 0 auto" }}>
          <Link
            href="/ingresar"
            style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15, color: "var(--text-primary)" }}
          >
            <IconoCuenta />
            <span className="header-texto-desktop">Iniciar sesión</span>
          </Link>
          <Link
            href="/carrito"
            aria-label="Mi pedido, 0 productos"
            style={{
              display: "flex",
              gap: 9,
              alignItems: "center",
              padding: "9px 14px",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            className="clip-corner-sm"
          >
            <IconoCarrito />
            <span className="font-data" style={{ fontSize: 13 }}>
              0
            </span>
          </Link>
        </div>
      </div>

      <nav
        aria-label="Categorías"
        className="header-nav-desktop"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <div
          style={{
            maxWidth: "var(--content-max-width)",
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            gap: 2,
            overflowX: "auto",
          }}
        >
          <button
            type="button"
            onClick={() => setMegaAbierto((v) => !v)}
            onMouseEnter={() => setMegaAbierto(true)}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "13px 13px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 15,
              color: megaAbierto ? "var(--accent)" : "var(--text-primary)",
              borderBottom: `2px solid ${megaAbierto ? "var(--accent)" : "transparent"}`,
              whiteSpace: "nowrap",
            }}
          >
            <IconoMenu chico />
            Productos
          </button>
          <EnlaceNav href="/como-comprar">Cómo comprar</EnlaceNav>
          <button
            type="button"
            onClick={() => setServAbierto((v) => !v)}
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              padding: "13px 13px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 15,
              color: servAbierto ? "var(--accent)" : "var(--text-muted)",
              whiteSpace: "nowrap",
            }}
          >
            Servicios
          </button>
          <EnlaceNav href="/devoluciones">Devoluciones</EnlaceNav>
          <EnlaceNav href="/contacto">Soporte</EnlaceNav>
        </div>
      </nav>

      {servAbierto && (
        <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)" }}>
          <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "18px 32px", display: "flex", gap: 14, flexWrap: "wrap" }}>
            {SERVICIOS.map((sv) => (
              <Link
                key={sv.tipo}
                href={`/servicios/${sv.tipo}`}
                className="clip-corner-md"
                style={{ flex: "1 1 260px", textAlign: "left", padding: "16px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
              >
                <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>{sv.nombre}</span>
                <span style={{ display: "block", marginTop: 5, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.5 }}>{sv.linea}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {megaAbierto && grupoActivoMega && (
        <div onMouseLeave={() => setMegaAbierto(false)} style={{ borderTop: "1px solid var(--border)", background: "var(--bg-surface)", boxShadow: "var(--shadow-overlay)" }}>
          <div style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "minmax(230px,280px) 1fr" }}>
            <div style={{ borderRight: "1px solid var(--border)", padding: "16px 0" }}>
              {grupos.map((g) => (
                <Link
                  key={g.id}
                  href={`/catalogo/${g.slug}`}
                  onMouseEnter={() => setGrupoMega(g.id)}
                  onClick={() => setMegaAbierto(false)}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    width: "100%",
                    textAlign: "left",
                    padding: "11px 20px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    fontSize: 15,
                    color: grupoMega === g.id ? "var(--accent)" : "var(--text-primary)",
                    background: grupoMega === g.id ? "var(--bg-card)" : "transparent",
                  }}
                >
                  {g.name}
                </Link>
              ))}
            </div>
            <div style={{ padding: "22px 28px" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 22 }}>{grupoActivoMega.name}</h3>
                <Link href={`/catalogo/${grupoActivoMega.slug}`} style={{ fontSize: 14, color: "var(--accent)" }} onClick={() => setMegaAbierto(false)}>
                  Ver todo en {grupoActivoMega.name}
                </Link>
              </div>
              <div style={{ columns: 3, columnGap: 24 }}>
                {grupoActivoMega.subcategoriasRaiz.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/catalogo/${grupoActivoMega.slug}/${s.slug}`}
                    onClick={() => setMegaAbierto(false)}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 0", fontSize: 14, color: "var(--text-muted)", lineHeight: 1.45, breakInside: "avoid" }}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {menuMovilAbierto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
            {grupoMovil && (
              <button type="button" onClick={() => setGrupoMovil(null)} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 15, color: "var(--accent)", minHeight: 44 }}>
                ‹ Volver
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuMovilAbierto(false)}
              style={{ width: 44, height: 44, display: "grid", placeItems: "center", border: "1px solid var(--border)" }}
            >
              ✕
            </button>
          </div>

          {!grupoMovil ? (
            <div style={{ flex: 1, overflow: "auto" }}>
              {grupos.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGrupoMovil(g)}
                  style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: 18, borderBottom: "1px solid var(--border)", minHeight: 60 }}
                >
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16 }}>{g.name}</span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: "var(--text-muted)" }}>
                      {g.subcategoriasRaiz.length} subcategorías
                    </span>
                  </span>
                  ›
                </button>
              ))}
            </div>
          ) : (
            <div style={{ flex: 1, overflow: "auto" }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", padding: 18, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 20 }}>{grupoMovil.name}</span>
                <Link href={`/catalogo/${grupoMovil.slug}`} onClick={() => setMenuMovilAbierto(false)} style={{ fontSize: 14, color: "var(--accent)", minHeight: 44 }}>
                  Ver todas
                </Link>
              </div>
              {grupoMovil.subcategoriasRaiz.map((s) => (
                <Link
                  key={s.slug}
                  href={`/catalogo/${grupoMovil.slug}/${s.slug}`}
                  onClick={() => setMenuMovilAbierto(false)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "17px 18px", borderBottom: "1px solid var(--border)", fontSize: 15.5, minHeight: 56 }}
                >
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 759px) {
          .header-menu-boton-movil { display: grid !important; }
          .header-nav-desktop { display: none !important; }
          .header-texto-desktop { display: none; }
        }
      `}</style>
    </header>
  );
}

function EnlaceNav({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "13px 13px",
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: 15,
        color: "var(--text-muted)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}

function IconoMenu({ chico }: { chico?: boolean }) {
  const s = chico ? 18 : 20;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: s, height: s, flex: "0 0 auto" }}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconoCuenta() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 20, height: 20, flex: "0 0 auto" }}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
    </svg>
  );
}

function IconoCarrito() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 19, height: 19 }}>
      <path d="M4 5h2.2l2.3 10.2h9.1L20 8H7" />
      <circle cx="10" cy="19" r="1.4" />
      <circle cx="17.5" cy="19" r="1.4" />
    </svg>
  );
}
