import Link from "next/link";
import Image from "next/image";
import {
  obtenerBannersActivos,
  obtenerFaqsPorAmbito,
  obtenerGrupos,
  obtenerImagenesPrincipales,
  obtenerMarcasActivas,
  obtenerMasVendidos,
  obtenerReseñasPublicadas,
} from "@/server/db/queries/catalogo";
import { mapearTarjetaProducto } from "@/lib/producto";
import { BannerHero } from "@/components/organisms/BannerHero";
import { PanelResenas } from "@/components/organisms/PanelResenas";
import { CuadriculaProductos } from "@/components/organisms/CuadriculaProductos";
import { CintaMarcas } from "@/components/organisms/CintaMarcas";
import { AcordeonFaqs } from "@/components/organisms/AcordeonFaqs";
import { urlImagenPublica } from "@/lib/imagenes";

// El catálogo cambia con el stock: la portada se sirve siempre en vivo
// (arquitectura.md §8, "el bloque de disponibilidad se renderiza dinámico").
export const dynamic = "force-dynamic";

const PASOS_COMO_COMPRAR = [
  { n: "01", titulo: "Crea tu cuenta", texto: "Con tus datos de contacto y tu dirección de envío. Si quieres factura, agrega tus datos fiscales." },
  { n: "02", titulo: "Genera tu pedido", texto: "Arma tu carrito y confírmalo. Te mostramos los datos bancarios y el importe exacto." },
  { n: "03", titulo: "Transfiere y sube tu comprobante", texto: "Paga por SPEI usando tu folio como concepto y sube la captura en Mis pedidos." },
  { n: "04", titulo: "Un asesor te contacta", texto: "En menos de 24 horas confirmamos tu pago, el envío y la fecha de entrega." },
] as const;

const SECTORES = ["Hogar", "Comercio", "Hotelería", "Industria", "Flotillas"] as const;

export default async function PaginaInicio() {
  const [grupos, banners, reseñas, masVendidosCrudos, marcas, faqs] = await Promise.all([
    obtenerGrupos(),
    obtenerBannersActivos(),
    obtenerReseñasPublicadas(4),
    obtenerMasVendidos(),
    obtenerMarcasActivas(),
    obtenerFaqsPorAmbito("general"),
  ]);

  const grupoSlugPorId = new Map(grupos.map((g) => [g.id, g.slug]));
  const imagenesPrincipales = await obtenerImagenesPrincipales(masVendidosCrudos.map((p) => p.id));
  const masVendidos = masVendidosCrudos.map((p) =>
    mapearTarjetaProducto(p, { imagenUrl: imagenesPrincipales.get(p.id) }),
  );

  const primerGrupoSlug = grupos[0]?.slug;

  return (
    <>
      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "16px 20px 0", display: "flex", flexWrap: "wrap", gap: 18, alignItems: "stretch" }}>
        <div style={{ flex: "1 1 560px", minWidth: 0 }}>
          <BannerHero banners={banners} grupoSlugPorId={grupoSlugPorId} />
        </div>
        <PanelResenas reseñas={reseñas} />
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "56px 20px 0" }}>
        <h2 style={{ margin: "0 0 18px" }}>Explora por categoría</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {grupos.map((g) => (
            <Link
              key={g.id}
              href={`/catalogo/${g.slug}`}
              className="clip-corner-md"
              style={{ position: "relative", display: "flex", flexDirection: "column", border: "1px solid var(--border)", background: "var(--bg-card)", overflow: "hidden" }}
            >
              <span style={{ position: "relative", display: "block", width: "100%", aspectRatio: "16/9", background: "var(--bg-elevated)" }}>
                {g.image_url && (
                  <Image src={urlImagenPublica(g.image_url)} alt="" fill sizes="220px" style={{ objectFit: "cover", opacity: 0.7 }} />
                )}
              </span>
              <span style={{ padding: 14, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 15.5 }}>{g.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "56px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Más vendidos</h2>
          {primerGrupoSlug && (
            <Link href={`/catalogo/${primerGrupoSlug}/todos`} style={{ fontSize: 15, color: "var(--accent)" }}>
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

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "56px 20px 0" }}>
        <h2 style={{ margin: "0 0 28px" }}>Cómo comprar</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 18 }}>
          {PASOS_COMO_COMPRAR.map((paso) => (
            <div key={paso.n} style={{ padding: 24, background: "var(--bg-card)", border: "1px solid var(--border)", borderTop: "2px solid var(--accent)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>{paso.n}</span>
              <h3 style={{ margin: "10px 0 8px", fontSize: 19 }}>{paso.titulo}</h3>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>{paso.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "56px 20px 0" }}>
        <h2 style={{ margin: "0 0 20px" }}>Sectores que atendemos</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {SECTORES.map((sector) => (
            <Link
              key={sector}
              href={primerGrupoSlug ? `/catalogo/${primerGrupoSlug}/todos` : "#"}
              style={{ padding: "14px 22px", border: "1px solid var(--border)", background: "var(--bg-card)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 16 }}
            >
              {sector}
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "48px 20px 0" }}>
        <CintaMarcas marcas={marcas} />
      </section>

      <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "56px 20px 80px" }}>
        <h2 style={{ margin: "0 0 24px" }}>Preguntas frecuentes</h2>
        <AcordeonFaqs preguntas={faqs} />
      </section>
    </>
  );
}
