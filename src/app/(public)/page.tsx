import Link from "next/link";
import Image from "next/image";
import {
  obtenerBannersActivos,
  obtenerFaqsPorAmbito,
  obtenerGrupos,
  obtenerImagenesPrincipales,
  obtenerMarcasActivas,
  obtenerMasVendidos,
  obtenerParaTi,
  obtenerReseñasPublicadas,
} from "@/server/db/queries/catalogo";
import { mapearTarjetaProducto, type ProductoTarjeta } from "@/lib/producto";
import { BannerHero } from "@/components/organisms/BannerHero";
import { CuadriculaProductos } from "@/components/organisms/CuadriculaProductos";
import { CintaMarcas } from "@/components/organisms/CintaMarcas";
import { AcordeonFaqs } from "@/components/organisms/AcordeonFaqs";
import { ParaTi } from "@/components/organisms/ParaTi";

// El catálogo cambia con el stock: la portada se sirve siempre en vivo
// (arquitectura.md §8, "el bloque de disponibilidad se renderiza dinámico").
export const dynamic = "force-dynamic";

/**
 * index.html:275-515 (`sc-if value="{{ isHome }}"`) — portada completa,
 * traducción literal: muro de video + reseñas + franja de confianza
 * (dentro de `BannerHero`), "Para Ti", "Más vendidos", "Cómo comprar",
 * "Servicios", "Sectores que atendemos", franja de marcas y preguntas
 * frecuentes.
 *
 * La sección "Arma tu sistema completo" (index.html:421-441, kit fijo con
 * SKU inventado `SGQ-VV-0045` y precio fijo `$5,899.00`) **no se
 * construye**: es PA-21, cerrada el 2026-09-20 — "no existe un concepto
 * real de 'kit destacado'; la sección se elimina de la portada en vez de
 * construirse" (`.devsquad/requerimientos.md` §8.2). No es una omisión
 * nueva de este incremento, es la decisión ya tomada por la dueña.
 */
const PASOS_COMO_COMPRAR = [
  { n: "01", titulo: "Crea tu cuenta", texto: "Con tus datos de contacto y tu dirección de envío. Si quieres factura, agrega tus datos fiscales." },
  { n: "02", titulo: "Genera tu pedido", texto: "Arma tu carrito y confírmalo. Te mostramos los datos bancarios y el importe exacto." },
  { n: "03", titulo: "Transfiere y sube tu comprobante", texto: "Paga por SPEI usando tu folio como concepto y sube la captura en Mis pedidos." },
  { n: "04", titulo: "Un asesor te contacta", texto: "En menos de 24 horas confirmamos tu pago, el envío y la fecha de entrega." },
] as const;

/** index.html:1968-1972 — mismas 3 líneas de servicio que el mega-menú y
 * el pie de página (`EncabezadoSitio`/`PiePagina`); las imágenes son las
 * mismas URLs de muestra del demo (Pexels, no forman parte de `uploads/`). */
const SERVICIOS = [
  {
    tipo: "monitoreo",
    nombre: "Monitoreo de alarmas 24/7",
    linea: "Conectamos tu sistema a central de monitoreo, atendemos eventos y te enviamos reportes.",
    img: "https://images.pexels.com/photos/11783119/pexels-photo-11783119.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    tipo: "guardias",
    nombre: "Guardias de seguridad",
    linea: "Guardias intramuros, control de acceso en recepción y rondines en turnos 12×12 y 24×24.",
    img: "https://images.pexels.com/photos/7388699/pexels-photo-7388699.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    tipo: "financiamiento",
    nombre: "Financiamiento y créditos",
    linea: "Compra tu equipo a plazos de 3, 6 o 12 meses. Sujeto a aprobación.",
    img: "https://images.pexels.com/photos/8470836/pexels-photo-8470836.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
] as const;

const SECTORES = ["Hogar", "Comercio", "Hotelería", "Industria", "Flotillas"] as const;

export default async function PaginaInicio() {
  const [grupos, banners, reseñas, masVendidosCrudos, marcas, faqs, pestañasParaTi] = await Promise.all([
    obtenerGrupos(),
    obtenerBannersActivos(),
    obtenerReseñasPublicadas(4),
    obtenerMasVendidos(),
    obtenerMarcasActivas(),
    obtenerFaqsPorAmbito("general"),
    obtenerParaTi(),
  ]);

  const grupoSlugPorId = new Map(grupos.map((g) => [g.id, g.slug]));

  const idsParaTi = pestañasParaTi.flatMap((t) => t.productos.map((p) => p.id));
  const idsImagenes = [...new Set([...masVendidosCrudos.map((p) => p.id), ...idsParaTi])];
  const imagenesPrincipales = await obtenerImagenesPrincipales(idsImagenes);

  const masVendidos = masVendidosCrudos.map((p) => mapearTarjetaProducto(p, { imagenUrl: imagenesPrincipales.get(p.id) }));

  const mapaProductosParaTi = new Map<string, ProductoTarjeta>();
  for (const pestaña of pestañasParaTi) {
    for (const p of pestaña.productos) {
      mapaProductosParaTi.set(p.id, mapearTarjetaProducto(p, { imagenUrl: imagenesPrincipales.get(p.id) }));
    }
  }

  const primerGrupoSlug = grupos[0]?.slug;

  return (
    <>
      <BannerHero banners={banners} grupoSlugPorId={grupoSlugPorId} reseñas={reseñas} />

      <ParaTi pestañas={pestañasParaTi} mapaProductos={mapaProductosParaTi} />

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,2.6vw,40px)", color: "#EAF2F8" }}>Más vendidos</h2>
          {primerGrupoSlug && (
            <Link href={`/catalogo/${primerGrupoSlug}/todos`} style={{ fontSize: 15, color: "#3CE7FF" }}>
              Ver todo el catálogo
            </Link>
          )}
        </div>
        <CuadriculaProductos
          productos={masVendidos}
          minColumnaPx={250}
          vacio={
            primerGrupoSlug
              ? { titulo: "Todavía no hay ventas registradas.", hrefAccion: `/catalogo/${primerGrupoSlug}`, textoAccion: "Ver catálogo" }
              : undefined
          }
        />
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 32px 0" }}>
        <h2 style={{ margin: "0 0 28px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,2.6vw,40px)", color: "#EAF2F8" }}>Cómo comprar</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
          {PASOS_COMO_COMPRAR.map((paso) => (
            <div key={paso.n} style={{ padding: 24, background: "#0F1D2B", border: "1px solid #1F3244", borderTop: "2px solid #3CE7FF" }}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: "#3CE7FF" }}>{paso.n}</span>
              <h3 style={{ margin: "10px 0 8px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 19, lineHeight: 1.25, color: "#EAF2F8" }}>{paso.titulo}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#9FB2C3" }}>{paso.texto}</p>
            </div>
          ))}
        </div>
        <Link href="/como-comprar" style={{ display: "inline-block", marginTop: 20, fontSize: 15, color: "#3CE7FF" }}>
          Ver el proceso completo
        </Link>
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 32px 0" }}>
        <h2 style={{ margin: "0 0 28px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,2.6vw,40px)", color: "#EAF2F8" }}>Servicios</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
          {SERVICIOS.map((sv) => (
            <div key={sv.tipo} style={{ background: "#0F1D2B", border: "1px solid #1F3244", display: "flex", flexDirection: "column" }}>
              <span style={{ display: "block", height: 170, background: "#12212F", position: "relative", overflow: "hidden" }}>
                <Image src={sv.img} alt="" fill sizes="280px" style={{ objectFit: "cover", opacity: 0.6 }} />
              </span>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                <h3 style={{ margin: 0, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 20, color: "#EAF2F8" }}>{sv.nombre}</h3>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "#9FB2C3", flex: 1 }}>{sv.linea}</p>
                <Link
                  href={`/servicios/${sv.tipo}`}
                  className="clip-corner-md"
                  style={{ alignSelf: "flex-start", border: "1px solid #3CE7FF", color: "#3CE7FF", padding: "10px 18px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 14 }}
                >
                  Solicitar información
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 32px 0" }}>
        <h2 style={{ margin: "0 0 20px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,2.6vw,40px)", color: "#EAF2F8" }}>Sectores que atendemos</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {SECTORES.map((sector) => (
            <Link
              key={sector}
              href={primerGrupoSlug ? `/catalogo/${primerGrupoSlug}/todos` : "/catalogo"}
              style={{ padding: "14px 22px", border: "1px solid #1F3244", background: "#0F1D2B", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 16, color: "#EAF2F8" }}
            >
              {sector}
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "60px 32px 0" }}>
        <CintaMarcas marcas={marcas} />
      </section>

      <section style={{ maxWidth: 1400, margin: "0 auto", padding: "72px 32px 80px" }}>
        <h2 style={{ margin: "0 0 24px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: "clamp(26px,2.6vw,40px)", color: "#EAF2F8" }}>Preguntas frecuentes</h2>
        <AcordeonFaqs preguntas={faqs} />
      </section>
    </>
  );
}
