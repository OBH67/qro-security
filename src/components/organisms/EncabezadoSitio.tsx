"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { GrupoConNavegacion, NodoNavegacionSubcategoria } from "@/server/db/queries/catalogo";
import { useCarrito } from "@/components/providers/CarritoProvider";
import { usePasoCicloHero } from "@/components/providers/CicloHeroProvider";

/**
 * Traducción literal de `index.html:39-271` (barra flotante + encabezado +
 * mega-menú + menú de pantalla completa en móvil). Valores exactos del
 * demo (colores, tamaños, `clip-path`) — no tokens de `globals.css`, por
 * instrucción explícita de la dueña del proyecto (`.devsquad/perfil.md`,
 * "Regla de traducción a código"): un token que vale lo mismo no sustituye
 * al valor literal en este archivo.
 *
 * Una desviación deliberada frente al demo (la única que queda — ver
 * historial de este archivo para la otra, revertida el 2026-09-21 a
 * pedido de la dueña: el encabezado principal volvió a ser
 * `position:relative`, como el demo, con la barra flotante compacta
 * reapareciendo según scroll):
 * 1. **Degradado solo en la portada.** En el demo `headerStyle`
 *    (index.html:2136) usa el degradado del hero (`hs.a`/`hs.b`) en TODAS
 *    las pantallas — al entrar al catálogo, producto, etc. el encabezado
 *    se queda con el color cambiante del hero de la portada, que ya no
 *    está en pantalla. Aquí el degradado cíclico (mismo arreglo fijo de 3
 *    colores y mismo intervalo de 5 s que el demo, `heroSlidesData`,
 *    index.html:1955-1959) solo se usa en `/`; el resto de las páginas usa
 *    un fondo sólido oscuro fijo. El carrusel real de banners de la
 *    portada (`BannerHero`) sigue siendo independiente (lee `banners` de
 *    la base de datos).
 *
 * **Barra flotante compacta** (index.html:39-60, `floatNavStyle`
 * index.html:2139, lógica de scroll index.html:1991-2004): traducción
 * literal. El encabezado principal es `position:relative` — al hacer
 * scroll se va con el contenido (en la portada, con el hero). La barra
 * compacta es `position:fixed`, oculta por default; se muestra solo al
 * hacer scroll hacia arriba y estando a más de 80px del top; se oculta
 * de nuevo al hacer scroll hacia abajo o al llegar cerca del top
 * (`useBarraFlotante`, mismo estado que `floatNav` del demo).
 */

const HERO_SLIDES = [
  { a: "#2E9E5B", b: "#0B2A17", grupoCodigo: "vv" },
  { a: "#1D5C9E", b: "#0A2038", grupoCodigo: "ec" },
  { a: "#1E8A4F", b: "#082A19", grupoCodigo: "ec" },
] as const;

const SERVICIOS = [
  { tipo: "monitoreo", nombre: "Monitoreo de alarmas 24/7", linea: "Conectamos tu sistema a central de monitoreo, atendemos eventos y te enviamos reportes." },
  { tipo: "guardias", nombre: "Guardias de seguridad", linea: "Guardias intramuros, control de acceso en recepción y rondines en turnos 12×12 y 24×24." },
  { tipo: "financiamiento", nombre: "Financiamiento y créditos", linea: "Compra tu equipo a plazos de 3, 6 o 12 meses. Sujeto a aprobación." },
] as const;

const LOGO_SRC = "/uploads/ChatGPT Image Sep 18, 2026, 10_42_49 PM.png";

/**
 * Columna de subcategorías del mega-menú (index.html:190-224 solo cubre un
 * nivel — el demo nunca modeló los 3 niveles reales de D7,
 * modelo-datos.md §3, que se capturaron después). Recursivo: cada
 * subcategoría se enlaza a la ruta completa desde la raíz (`.../[...subcategoria]`)
 * y sus hijos se listan debajo, indentados y en tamaño menor.
 */
function ColumnaSubcategoriaMega({
  nodo,
  grupoSlug,
  rutaPadre,
  nivel,
  onNavegar,
}: {
  nodo: NodoNavegacionSubcategoria;
  grupoSlug: string;
  rutaPadre: string[];
  nivel: number;
  onNavegar: () => void;
}) {
  const ruta = [...rutaPadre, nodo.slug];
  return (
    <div style={{ breakInside: "avoid", marginBottom: nivel === 0 ? 4 : 0 }}>
      <Link
        href={`/catalogo/${grupoSlug}/${ruta.join("/")}`}
        onClick={onNavegar}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "6px 0",
          paddingLeft: nivel * 14,
          fontSize: nivel === 0 ? 14 : 13,
          fontWeight: nivel === 0 ? 500 : 400,
          color: nivel === 0 ? "#EAF2F8" : "#9FB2C3",
          lineHeight: 1.45,
        }}
      >
        {nodo.name}
      </Link>
      {nodo.hijos.map((hijo) => (
        <ColumnaSubcategoriaMega
          key={hijo.slug}
          nodo={hijo}
          grupoSlug={grupoSlug}
          rutaPadre={ruta}
          nivel={nivel + 1}
          onNavegar={onNavegar}
        />
      ))}
    </div>
  );
}

export function EncabezadoSitio({
  grupos,
  sesion,
}: {
  grupos: GrupoConNavegacion[];
  sesion: { nombre: string } | null;
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [grupoMovil, setGrupoMovil] = useState<GrupoConNavegacion | null>(null);
  const [pilaSubMovil, setPilaSubMovil] = useState<NodoNavegacionSubcategoria[]>([]);
  const [megaAbierto, setMegaAbierto] = useState(false);
  const [servAbierto, setServAbierto] = useState(false);
  const [grupoMegaId, setGrupoMegaId] = useState(grupos[0]?.id ?? "");
  const [esMovil, setEsMovil] = useState(false);
  const [flash, setFlash] = useState(false);
  const carrito = useCarrito();
  const cantidadPrevia = useRef(carrito.cantidadTotal);
  const pathname = usePathname();
  const esHome = pathname === "/";

  const grupoActivoMega = grupos.find((g) => g.id === grupoMegaId) ?? grupos[0];

  // Ciclo del degradado del encabezado — index.html:1987 (`this.cycle`, 5 s).
  // Solo se pinta en la portada, el resto usa fondo sólido (ver comentario
  // de cabecera, punto 1). El "paso" viene de `CicloHeroProvider`, el mismo
  // reloj único que usa `BannerHero` para su carrusel — antes cada uno
  // llevaba su propio `setInterval`/estado, "sincronizados" solo porque
  // compartían período por convención; se desincronizaban en cuanto uno se
  // desmontaba y el otro no (ver el comentario del Provider para el detalle
  // completo). Con un solo reloj compartido no hay nada que resincronizar.
  const paso = usePasoCicloHero();
  const hs = HERO_SLIDES[paso % HERO_SLIDES.length];

  // Ancho de pantalla (index.html:1988, `mobile: window.innerWidth < 760`).
  useEffect(() => {
    const onResize = () => setEsMovil(window.innerWidth < 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Barra flotante compacta — index.html:1991-2004 (`onScroll`), traducción
  // literal: oculta a menos de 80px del top, oculta al bajar, visible al
  // subir.
  const [barraFlotanteVisible, setBarraFlotanteVisible] = useState(false);
  useEffect(() => {
    let ultimoY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const subiendo = y < ultimoY;
      const bajando = y > ultimoY;
      ultimoY = y;
      setBarraFlotanteVisible((actual) => {
        if (y < 80) return false;
        if (bajando) return false;
        if (subiendo) return true;
        return actual;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Destello del botón de carrito al agregar algo — index.html:2189 (`s.flash`).
  useEffect(() => {
    if (carrito.cantidadTotal > cantidadPrevia.current) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 700);
      cantidadPrevia.current = carrito.cantidadTotal;
      return () => clearTimeout(t);
    }
    cantidadPrevia.current = carrito.cantidadTotal;
  }, [carrito.cantidadTotal]);

  // "Mi cuenta" en móvil trae su propio encabezado dedicado (botón volver +
  // título + acceso a pedidos, ver `EncabezadoCuentaMovil` en
  // `mi-cuenta/layout.tsx`) — a pedido explícito de la dueña, esta barra
  // completa (buscador, chips "Para Ti/Novedades/...", logo) desaparece por
  // completo ahí, no solo el buscador/chips. En escritorio no cambia nada:
  // `esMovil` es siempre `false` ahí. Después de todos los hooks (Reglas de
  // los Hooks: un `return` condicional antes de un hook cambiaría cuántos
  // se llaman entre renders al entrar/salir de /mi-cuenta en móvil).
  if (esMovil && pathname.startsWith("/mi-cuenta")) return null;

  return (
    <>
      {/* Barra flotante compacta — index.html:39-60. Oculta por default,
          `translateY(-100%)` + `opacity:0` cuando no debe verse (mismo
          patrón que el demo: siempre montada, se anima con `transform`). */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 80,
          transition: "transform 260ms ease, opacity 260ms ease",
          transform: barraFlotanteVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: barraFlotanteVisible ? 1 : 0,
          background: "#07111CF2",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1F3244",
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "10px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          {esMovil && (
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => {
                setMenuMovilAbierto(true);
                setGrupoMovil(null);
                setPilaSubMovil([]);
              }}
              style={{ width: 40, height: 40, display: "grid", placeItems: "center", border: "1px solid #1F3244", flex: "0 0 auto" }}
            >
              <IconoMenu tamano={18} />
            </button>
          )}
          <Link href="/" aria-label="Inicio" style={{ width: 36, height: 36, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto", display: "block" }}>
            <Image src={LOGO_SRC} alt="SGQ" width={36} height={36} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Link>
          <form action="/buscar" method="GET" style={{ flex: 1, minWidth: 0 }}>
            <input
              type="search"
              name="q"
              placeholder="Busca por producto, marca o SKU"
              aria-label="Buscar"
              style={{ width: "100%", padding: "9px 12px", background: "#0F1D2B", border: "1px solid #1F3244", borderRadius: 4, color: "#EAF2F8", fontSize: 14 }}
            />
          </form>
          <Link href={sesion ? "/mi-cuenta/pedidos" : "/ingresar"} aria-label="Mi cuenta" style={{ width: 40, height: 40, display: "grid", placeItems: "center", color: "#EAF2F8", flex: "0 0 auto" }}>
            <IconoCuenta tamano={20} />
          </Link>
          <Link
            href="/carrito"
            aria-label={`Mi pedido, ${carrito.cantidadTotal} productos`}
            style={{ display: "flex", gap: 6, alignItems: "center", padding: "9px 12px", background: "#3CE7FF", color: "#07111C", flex: "0 0 auto" }}
            className="clip-corner-sm"
          >
            <IconoCarrito tamano={19} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 500 }}>{carrito.cantidadTotal}</span>
          </Link>
        </div>
      </div>

      {/* Encabezado principal — index.html:62-225. `position:relative`: se
          va con el contenido al hacer scroll (en la portada, con el hero,
          por eso el degradado de arriba) — la barra flotante de arriba es
          la que cubre la navegación mientras el encabezado no está a la
          vista. */}
      <header
        style={{
          position: "relative",
          zIndex: 5,
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #FFFFFF1A",
          background: esHome
            ? `linear-gradient(100deg,${hs.a}E6 0%,${hs.b}E6 65%,#07111CE6 100%)`
            : "#07111CF2",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "clamp(9px,1.1vw,12px) clamp(12px,1.6vw,20px)",
            display: "flex",
            gap: "clamp(10px,1.3vw,18px)",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {esMovil && (
            <button
              type="button"
              aria-label="Abrir menú"
              onClick={() => {
                setMenuMovilAbierto(true);
                setGrupoMovil(null);
                setPilaSubMovil([]);
              }}
              style={{ width: 44, height: 44, display: "grid", placeItems: "center", border: "1px solid #1F3244", flex: "0 0 auto" }}
            >
              <IconoMenu tamano={20} />
            </button>
          )}

          <Link href="/" style={{ display: "flex", gap: 12, alignItems: "center", flex: "0 0 auto" }}>
            <span style={{ position: "relative", width: 40, height: 40, flex: "0 0 auto", borderRadius: "50%", overflow: "hidden", boxShadow: "0 0 14px rgba(60,231,255,.28)", display: "block" }}>
              <Image src={LOGO_SRC} alt="SGQ" width={40} height={40} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </span>
            {!esMovil && (
              <span style={{ textAlign: "left", lineHeight: 1.05 }}>
                <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 17, color: "#EAF2F8" }}>
                  Seguridad General
                </span>
                <span style={{ display: "block", fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, letterSpacing: 2, color: "#9FB2C3" }}>
                  QUERÉTARO
                </span>
              </span>
            )}
          </Link>

          <form
            action="/buscar"
            method="GET"
            style={{ position: "relative", ...(esMovil ? { order: 9, flex: "1 1 100%", minWidth: 0 } : { flex: "1 1 240px", minWidth: 160 }) }}
          >
            <input
              type="search"
              name="q"
              placeholder="Busca por producto, marca o SKU"
              aria-label="Buscar"
              style={{
                width: "100%",
                padding: "11px 14px 11px 40px",
                background: "#0F1D2B",
                border: "1px solid #1F3244",
                borderRadius: 4,
                color: "#EAF2F8",
                fontSize: 15,
              }}
            />
            <svg viewBox="0 0 24 24" fill="none" stroke="#9FB2C3" strokeWidth={1.5} style={{ position: "absolute", left: 13, top: 12, width: 18, height: 18, pointerEvents: "none" }}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "clamp(8px,1.1vw,16px)", marginLeft: "auto", flex: "0 0 auto" }}>
            <BotonAvisos mostrarTexto={!esMovil} />
            {!esMovil && <BotonOfertas />}

            <Link
              href={sesion ? "/mi-cuenta/pedidos" : "/ingresar"}
              aria-label="Mi cuenta"
              style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15, color: "#EAF2F8", whiteSpace: "nowrap" }}
            >
              <IconoCuenta tamano={20} />
              {!esMovil && <span>{sesion ? `Hola, ${sesion.nombre}` : "Iniciar sesión"}</span>}
            </Link>

            <Link
              href="/carrito"
              aria-label={`Mi pedido, ${carrito.cantidadTotal} productos`}
              style={
                esMovil
                  ? {
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      minHeight: 44,
                      padding: "9px 13px",
                      background: "#3CE7FF",
                      color: "#07111C",
                      ...(flash ? { animation: "sgFlash .7s both" } : {}),
                    }
                  : {
                      display: "flex",
                      gap: 9,
                      alignItems: "center",
                      padding: "9px 14px",
                      border: `1px solid ${flash ? "#3CE7FF" : "#1F3244"}`,
                      color: flash ? "#3CE7FF" : "#EAF2F8",
                      ...(flash ? { animation: "sgFlash .7s both" } : {}),
                    }
              }
              className="clip-corner-sm"
            >
              <IconoCarrito tamano={21} />
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, fontWeight: 500 }}>{carrito.cantidadTotal}</span>
            </Link>
          </div>
        </div>

        {/* Chips de navegación en móvil — index.html:125-133 */}
        {esMovil && (
          <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "0 14px 13px", overflowX: "auto" }}>
            {CHIPS_NAV.map((chip, i) => (
              <Link
                key={chip.nombre}
                href={chip.href}
                style={{
                  flex: "0 0 auto",
                  minHeight: 40,
                  padding: "9px 15px",
                  borderRadius: 9,
                  background: i === 0 ? "rgba(60,231,255,.14)" : "#16283A",
                  border: `1px solid ${i === 0 ? "#3CE7FF" : "#1F3244"}`,
                  fontFamily: "'Chakra Petch',sans-serif",
                  fontWeight: 500,
                  fontSize: 14.5,
                  whiteSpace: "nowrap",
                  color: i === 0 ? "#3CE7FF" : "#EAF2F8",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {chip.nombre}
              </Link>
            ))}
          </div>
        )}

        {/* Navegación de escritorio — index.html:135-175 */}
        {!esMovil && (
          <div style={{ borderTop: "1px solid #16283A" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 clamp(12px,1.6vw,20px)", display: "flex", alignItems: "center", gap: 2, overflowX: "auto" }}>
              <button
                type="button"
                onClick={() => setMegaAbierto((v) => !v)}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  fontFamily: "'Chakra Petch',sans-serif",
                  fontWeight: 500,
                  fontSize: 16,
                  whiteSpace: "nowrap",
                  padding: "6px 0",
                  borderBottom: `2px solid ${megaAbierto ? "#3CE7FF" : "transparent"}`,
                  color: megaAbierto ? "#3CE7FF" : "#EAF2F8",
                  marginRight: 11,
                }}
              >
                <IconoMenu tamano={18} />
                Productos
              </button>
              <EnlaceNav href="/como-comprar">
                <IconoRayo />
                Novedades
              </EnlaceNav>
              <button
                type="button"
                onClick={() => setServAbierto((v) => !v)}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "13px 13px",
                  fontFamily: "'Chakra Petch',sans-serif",
                  fontWeight: 500,
                  fontSize: 15,
                  color: servAbierto ? "#3CE7FF" : "#9FB2C3",
                  whiteSpace: "nowrap",
                  borderBottom: `2px solid ${servAbierto ? "#3CE7FF" : "transparent"}`,
                }}
              >
                <IconoServicios />
                Servicios
                <IconoChevronAbajo />
              </button>
              {/* index.html:2198 — el propio demo manda "Marcas" a home
                  (`go('home')`), nunca hubo una pantalla de marcas. Traducción
                  literal: no se inventa una página que el demo no tiene. */}
              <EnlaceNav href="/">
                <IconoEstrella />
                Marcas
              </EnlaceNav>
              <EnlaceNav href={grupos[1] ? `/catalogo/${grupos[1].slug}/todos` : "/catalogo"}>
                <IconoPromociones />
                Promociones
              </EnlaceNav>
              <EnlaceNav href="/como-comprar">
                <IconoComoComprar />
                Cómo comprar
              </EnlaceNav>
              <EnlaceNav href="/devoluciones">
                <IconoDevoluciones />
                Devoluciones
              </EnlaceNav>
              <EnlaceNav href="/contacto">
                <IconoSoporte />
                Soporte
              </EnlaceNav>
            </div>
          </div>
        )}

        {/* Panel de servicios — index.html:177-188 */}
        {servAbierto && (
          <div style={{ borderTop: "1px solid #1F3244", background: "#0F1D2B" }}>
            <div style={{ maxWidth: 1400, margin: "0 auto", padding: "18px 32px", display: "flex", gap: 14, flexWrap: "wrap" }}>
              {SERVICIOS.map((sv) => (
                <Link
                  key={sv.tipo}
                  href={`/servicios/${sv.tipo}`}
                  className="clip-corner-md"
                  style={{ flex: "1 1 260px", textAlign: "left", padding: "16px 18px", background: "#122234", border: "1px solid #1F3244" }}
                >
                  <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 17, color: "#EAF2F8" }}>{sv.nombre}</span>
                  <span style={{ display: "block", marginTop: 5, fontSize: 14, color: "#9FB2C3", lineHeight: 1.5 }}>{sv.linea}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </header>

      {/* Mega-menú — index.html:190-224 solo cubre el contenido (título +
          columnas); la estructura de overlay es deliberadamente distinta
          del demo, a pedido explícito de la dueña: es una toma de pantalla
          completa (como la referencia que compartió, no el demo) que se
          sobrepone a TODA la interfaz — incluido el propio encabezado, no
          solo el contenido debajo de él — por eso empieza en `top:0` con
          zIndex mayor que el header, y trae su propio botón de cerrar (la
          barra de navegación queda tapada mientras está abierto). Cada
          panel (la barra de grupos y el contenido de subcategorías) tiene
          su propio scroll interno e independiente del otro y de la página
          de fondo.
          Deliberadamente FUERA de `<header>`: el header tiene
          `backdropFilter`, que crea un nuevo *containing block* para
          descendientes `position:fixed` (igual que `transform`/`filter`) —
          si este overlay quedara anidado adentro, `top`/`bottom` se
          calcularían contra la caja del header (~120px) en vez del
          viewport, colapsándolo a un par de píxeles de alto. */}
      {megaAbierto && grupoActivoMega && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            display: "flex",
            flexDirection: "column",
            background: "#0B1622",
          }}
        >
          {/* Barra superior con cierre — reemplaza visualmente al encabezado
              normal mientras el menú está abierto, index.html no tiene
              equivalente (ahí el header nunca se tapa a sí mismo). */}
          <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 20px", borderBottom: "1px solid #1F3244" }}>
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMegaAbierto(false)}
              style={{ width: 44, height: 44, display: "grid", placeItems: "center", border: "1px solid #1F3244" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#EAF2F8" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
          {/* Barra de grupos — alto completo del overlay, no del contenido */}
          <div style={{ width: 280, flex: "0 0 auto", borderRight: "1px solid #1F3244", overflowY: "auto", padding: "16px 0" }}>
            {grupos.map((g) => (
              <Link
                key={g.id}
                href={`/catalogo/${g.slug}`}
                onMouseEnter={() => setGrupoMegaId(g.id)}
                onClick={() => setMegaAbierto(false)}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  padding: "13px 20px",
                  background: grupoMegaId === g.id ? "#122234" : "transparent",
                }}
              >
                <span style={{ flex: 1, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15, color: "#EAF2F8" }}>{g.name}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="#EAF2F8" strokeWidth={1.5} style={{ width: 16, height: 16, opacity: 0.6 }}>
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Contenido del grupo activo — alto completo, scroll propio */}
          <div style={{ flex: 1, overflowY: "auto", overscrollBehavior: "contain" }}>
            <div style={{ maxWidth: 1120, padding: "22px 28px", display: "grid", gridTemplateColumns: "1fr minmax(0,260px)", gap: 24 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 22, color: "#EAF2F8" }}>{grupoActivoMega.name}</h3>
                  <Link href={`/catalogo/${grupoActivoMega.slug}`} onClick={() => setMegaAbierto(false)} style={{ fontSize: 14, color: "#3CE7FF" }}>
                    Ver todo en {grupoActivoMega.name}
                  </Link>
                </div>
                <div style={{ columns: 3, columnGap: 24 }}>
                  {grupoActivoMega.subcategoriasRaiz.map((s) => (
                    <ColumnaSubcategoriaMega
                      key={s.slug}
                      nodo={s}
                      grupoSlug={grupoActivoMega.slug}
                      rutaPadre={[]}
                      nivel={0}
                      onNavegar={() => setMegaAbierto(false)}
                    />
                  ))}
                </div>
              </div>
              <div style={{ borderLeft: "1px solid #1F3244", paddingLeft: 24 }}>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: "#9FB2C3" }}>DESTACADO</span>
                {grupoActivoMega.destacado ? (
                  <Link
                    href={`/producto/${grupoActivoMega.destacado.slug}`}
                    onClick={() => setMegaAbierto(false)}
                    style={{ display: "block", width: "100%", textAlign: "left", marginTop: 10 }}
                  >
                    <span style={{ display: "block", position: "relative", height: 130, background: "#E7EDF2", overflow: "hidden" }}>
                      {grupoActivoMega.destacado.imagenUrl && (
                        <Image
                          src={grupoActivoMega.destacado.imagenUrl}
                          alt=""
                          fill
                          sizes="260px"
                          style={{ objectFit: "cover", opacity: 0.85 }}
                        />
                      )}
                    </span>
                    <span style={{ display: "block", marginTop: 10, fontSize: 14, lineHeight: 1.4, color: "#EAF2F8" }}>{grupoActivoMega.destacado.name}</span>
                    <span style={{ display: "block", marginTop: 6, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 18, color: "#3CE7FF" }}>
                      {grupoActivoMega.destacado.priceFmt}
                    </span>
                  </Link>
                ) : (
                  <p style={{ marginTop: 10, fontSize: 13, color: "#9FB2C3" }}>Este grupo todavía no tiene productos activos.</p>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Menú de pantalla completa en móvil — index.html:227-271 */}
      {menuMovilAbierto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#07111C", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center", padding: "16px 18px", borderBottom: "1px solid #1F3244" }}>
            {grupoMovil && (
              <button
                type="button"
                onClick={() =>
                  pilaSubMovil.length > 0
                    ? setPilaSubMovil((p) => p.slice(0, -1))
                    : setGrupoMovil(null)
                }
                style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 15, color: "#3CE7FF", minHeight: 44 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
                  <path d="m15 6-6 6 6 6" />
                </svg>
                Volver
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setMenuMovilAbierto(false)}
              style={{ width: 44, height: 44, display: "grid", placeItems: "center", border: "1px solid #1F3244" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#EAF2F8" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          {!grupoMovil ? (
            <div style={{ flex: 1, overflow: "auto" }}>
              <div style={{ padding: 18 }}>
                <input
                  placeholder="Busca una categoría"
                  style={{ width: "100%", padding: "13px 14px", background: "#0F1D2B", border: "1px solid #1F3244", borderRadius: 4, fontSize: 15, color: "#EAF2F8" }}
                />
              </div>
              {grupos.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setGrupoMovil(g);
                    setPilaSubMovil([]);
                  }}
                  style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: 18, borderBottom: "1px solid #1F3244", minHeight: 60 }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 16, color: "#EAF2F8" }}>{g.name}</span>
                    <span style={{ display: "block", marginTop: 2, fontSize: 12.5, color: "#9FB2C3" }}>
                      {g.subcategoriasRaiz.length} subcategorías
                    </span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="#9FB2C3" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              ))}
            </div>
          ) : (() => {
            // Drill-down por niveles (D7, modelo-datos.md §3 — hasta 3
            // niveles): cada toque a una subcategoría con hijos entra un
            // nivel más (empuja la pila), y "Volver" la saca. Una hoja sin
            // hijos navega directo al catálogo, igual que antes.
            const nodoActual = pilaSubMovil[pilaSubMovil.length - 1] ?? null;
            const listaActual = nodoActual ? nodoActual.hijos : grupoMovil.subcategoriasRaiz;
            const rutaAcumulada = pilaSubMovil.map((n) => n.slug);
            const hrefVerTodas = [grupoMovil.slug, ...rutaAcumulada].join("/");
            return (
              <div style={{ flex: 1, overflow: "auto" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", padding: 18, borderBottom: "1px solid #1F3244", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 20, color: "#EAF2F8" }}>
                    {nodoActual ? nodoActual.name : grupoMovil.name}
                  </span>
                  <Link href={`/catalogo/${hrefVerTodas}`} onClick={() => setMenuMovilAbierto(false)} style={{ fontSize: 14, color: "#3CE7FF", minHeight: 44 }}>
                    Ver todas
                  </Link>
                </div>
                {listaActual.map((s) =>
                  s.hijos.length > 0 ? (
                    <button
                      key={s.slug}
                      type="button"
                      onClick={() => setPilaSubMovil((p) => [...p, s])}
                      style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: "17px 18px", borderBottom: "1px solid #1F3244", fontSize: 15.5, color: "#EAF2F8", minHeight: 56 }}
                    >
                      <span style={{ flex: 1 }}>{s.name}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#9FB2C3" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      key={s.slug}
                      href={`/catalogo/${grupoMovil.slug}/${[...rutaAcumulada, s.slug].join("/")}`}
                      onClick={() => setMenuMovilAbierto(false)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "17px 18px", borderBottom: "1px solid #1F3244", fontSize: 15.5, color: "#EAF2F8", minHeight: 56 }}
                    >
                      {s.name}
                    </Link>
                  ),
                )}
              </div>
            );
          })()}
        </div>
      )}
    </>
  );
}

const CHIPS_NAV = [
  { nombre: "Para Ti", href: "/" },
  { nombre: "Novedades", href: "/como-comprar" },
  { nombre: "Servicios", href: "/servicios/monitoreo" },
  { nombre: "Marcas", href: "/marcas" },
  { nombre: "Promociones", href: "/catalogo" },
  { nombre: "Cómo comprar", href: "/como-comprar" },
  { nombre: "Devoluciones", href: "/devoluciones" },
] as const;

function EnlaceNav({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        padding: "13px 13px",
        fontFamily: "'Chakra Petch',sans-serif",
        fontWeight: 500,
        fontSize: 15,
        color: "#9FB2C3",
        whiteSpace: "nowrap",
        borderBottom: "2px solid transparent",
      }}
    >
      {children}
    </Link>
  );
}

function BotonAvisos({ mostrarTexto }: { mostrarTexto: boolean }) {
  return (
    <Link
      href="/mi-cuenta/pedidos"
      aria-label="Avisos"
      style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 44, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15, color: "#EAF2F8", whiteSpace: "nowrap" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 20, height: 20, flex: "0 0 auto" }}>
        <path d="M5 19a1 1 0 1 0 0-.01" />
        <path d="M5 12a7 7 0 0 1 7 7" />
        <path d="M5 5a14 14 0 0 1 14 14" />
      </svg>
      {mostrarTexto && <span>Avisos</span>}
    </Link>
  );
}

function BotonOfertas() {
  return (
    <Link
      href="/catalogo"
      aria-label="Ofertas"
      style={{ position: "relative", display: "flex", gap: 8, alignItems: "center", minHeight: 44, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 15, color: "#EAF2F8", whiteSpace: "nowrap" }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 20, height: 20, flex: "0 0 auto" }}>
        <path d="m12 4 2.3 4.9 5.2.7-3.8 3.7 1 5.2-4.7-2.6-4.7 2.6 1-5.2L4.5 9.6l5.2-.7z" />
      </svg>
      <span>Ofertas</span>
      <span style={{ position: "absolute", top: 4, right: -4, width: 7, height: 7, borderRadius: "50%", background: "#FF4D5E" }} />
    </Link>
  );
}

function IconoMenu({ tamano }: { tamano: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#EAF2F8" strokeWidth={1.5} style={{ width: tamano, height: tamano }}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconoCuenta({ tamano }: { tamano: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: tamano, height: tamano, flex: "0 0 auto" }}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" />
    </svg>
  );
}

function IconoCarrito({ tamano }: { tamano: number }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: tamano, height: tamano }}>
      <path d="M4 5h2.2l2.3 10.2h9.1L20 8H7" />
      <circle cx="10" cy="19" r="1.4" />
      <circle cx="17.5" cy="19" r="1.4" />
    </svg>
  );
}

function IconoRayo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <path d="M13 3 5 14h6l-1 7 8-11h-6z" />
    </svg>
  );
}

function IconoServicios() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <rect x="3" y="5" width="18" height="11" rx="1.5" />
      <path d="M9 20h6" />
    </svg>
  );
}

function IconoChevronAbajo() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 14, height: 14, opacity: 0.7 }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function IconoEstrella() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z" />
    </svg>
  );
}

function IconoPromociones() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <path d="M20 12.5 12.5 20 4 11.5V4h7.5z" />
      <circle cx="8.5" cy="8.5" r="1.3" />
    </svg>
  );
}

function IconoComoComprar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <rect x="3" y="5" width="18" height="4" />
      <path d="M5 9v10h14V9M10 13h4" />
    </svg>
  );
}

function IconoDevoluciones() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <path d="M4 9h11a4 4 0 1 1 0 8H9" />
      <path d="m8 5-4 4 4 4" />
    </svg>
  );
}

function IconoSoporte() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ width: 18, height: 18, flex: "0 0 auto" }}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
      <path d="m6.4 6.4 3.3 3.3M17.6 6.4l-3.3 3.3M17.6 17.6l-3.3-3.3M6.4 17.6l3.3-3.3" />
    </svg>
  );
}
