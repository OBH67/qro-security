import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  obtenerAtributosDeCategoria,
  obtenerDocumentosProducto,
  obtenerGaleriaProducto,
  obtenerImagenesPrincipales,
  obtenerProductoPorSlug,
  obtenerRelacionados,
} from "@/server/db/queries/catalogo";
import { construirFilasEspecificaciones, mapearTarjetaProducto } from "@/lib/producto";
import { formatearPrecio, stockDisponible, etiquetaStock, barrasStock, nivelStock } from "@/lib/formato";
import { PRODUCTOS_RELACIONADOS } from "@/lib/constantes";
import { Migas } from "@/components/molecules/Migas";
import { GaleriaProducto } from "@/components/organisms/GaleriaProducto";
import { PestanasProducto } from "@/components/organisms/PestanasProducto";
import { CuadriculaProductos } from "@/components/organisms/CuadriculaProductos";
import { IndicadorStock } from "@/components/molecules/IndicadorStock";
import { AgregarAlPedido } from "@/components/organisms/AgregarAlPedido";
import { Boton } from "@/components/atoms/Boton";
import { Etiqueta } from "@/components/atoms/Etiqueta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await obtenerProductoPorSlug(slug);
  if (!producto) return { title: "Producto no encontrado — SG Querétaro" };
  return {
    title: `${producto.name} — SG Querétaro`,
    description: producto.description ?? undefined,
  };
}

/** index.html:702-856 — ficha de producto (A3). Muestra nombre, marca,
 * SKU, grupo/subcategoría, precio con IVA, stock, galería y ficha técnica
 * (criterio A3.1); indica explícitamente que el precio incluye IVA
 * (A3.3); el mensaje de envío usa la decisión ya cerrada de PA-4
 * ("el asesor lo confirma al marcar Enviado"). */
export default async function PaginaProducto({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await obtenerProductoPorSlug(slug);
  if (!producto) notFound();

  const [imagenes, documentos, atributosCategoria, relacionadosCrudos] = await Promise.all([
    obtenerGaleriaProducto(producto.id),
    obtenerDocumentosProducto(producto.id),
    obtenerAtributosDeCategoria({ groupId: producto.grupo.id, subcategoryId: producto.subcategoria.id }),
    obtenerRelacionados({
      productId: producto.id,
      subcategoryId: producto.subcategoria.id,
      limite: PRODUCTOS_RELACIONADOS,
    }),
  ]);

  const imagenesRelacionados = await obtenerImagenesPrincipales(relacionadosCrudos.map((p) => p.id));
  const relacionados = relacionadosCrudos.map((p) =>
    mapearTarjetaProducto(p, { imagenUrl: imagenesRelacionados.get(p.id) }),
  );

  const etiquetasPorClave = new Map(atributosCategoria.map((a) => [a.key, a.label]));
  const especificaciones = construirFilasEspecificaciones(producto.attributes, etiquetasPorClave);

  const disponible = stockDisponible(producto.stock, producto.reserved);
  const rutaSubcategorias = producto.cadenaSubcategorias.map((s, i, arr) => ({
    label: s.name,
    href:
      i === arr.length - 1
        ? undefined
        : `/catalogo/${producto.grupo.slug}/${arr
            .slice(0, i + 1)
            .map((c) => c.slug)
            .join("/")}`,
  }));

  return (
    <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "28px 20px 80px" }}>
      <Migas
        items={[
          { label: "Inicio", href: "/" },
          { label: producto.grupo.name, href: `/catalogo/${producto.grupo.slug}` },
          ...rutaSubcategorias,
        ]}
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 44, alignItems: "start" }}>
        <GaleriaProducto sku={producto.sku} nombre={producto.name} imagenes={imagenes} />

        <div style={{ maxWidth: 620 }}>
          <div className="font-data" style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 12, color: "var(--text-muted)" }}>
            <span>{producto.sku}</span>
            {producto.brand && (
              <>
                <span style={{ color: "var(--border)" }}>|</span>
                <span>{producto.brand.name.toUpperCase()}</span>
              </>
            )}
          </div>

          <h1 style={{ margin: "12px 0 0", fontSize: "clamp(26px,2.6vw,36px)", lineHeight: 1.2 }}>{producto.name}</h1>

          {producto.condition === "usado" && (
            <div style={{ marginTop: 12 }}>
              <Etiqueta tono="advertencia">Usado{producto.condition_detail ? ` — ${producto.condition_detail}` : ""}</Etiqueta>
            </div>
          )}

          <div style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 12 }}>
            <span className="font-data" style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 40 }}>
              {formatearPrecio(producto.price)}
            </span>
            <span style={{ fontSize: 14, color: "var(--text-muted)" }}>IVA incluido</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <IndicadorStock barras={barrasStock(disponible)} etiqueta={etiquetaStock(disponible)} nivel={nivelStock(disponible)} />
          </div>

          {disponible > 0 ? (
            <AgregarAlPedido
              producto={{
                productId: producto.id,
                sku: producto.sku,
                slug: producto.slug,
                name: producto.name,
                price: Number(producto.price),
                disponible,
                imagenUrl: imagenes[0]?.url ?? null,
              }}
            />
          ) : (
            <div style={{ marginTop: 26 }}>
              <Boton variante="deshabilitada" tamano="lg" disabled>
                Agotado
              </Boton>
            </div>
          )}

          <div style={{ marginTop: 26, padding: 18, border: "1px solid var(--border)", background: "var(--bg-card)", display: "flex", gap: 14, alignItems: "flex-start" }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} style={{ width: 20, height: 20, flex: "0 0 auto", marginTop: 2 }}>
              <rect x="3" y="6" width="18" height="12" />
              <path d="M3 10h18" />
            </svg>
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
              Pagas por transferencia. Al generar tu pedido te mostramos los datos bancarios. Tu asesor confirma el
              costo y la fecha de envío al marcar tu pedido como enviado.
            </p>
          </div>

          <p style={{ margin: "18px 0 0", fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>
            Devoluciones en saldo a favor: 100% si el producto está sellado, 70% si está abierto.{" "}
            <a href="/devoluciones" style={{ color: "var(--accent)" }}>
              Ver política
            </a>
          </p>
        </div>
      </div>

      <PestanasProducto
        descripcion={producto.description}
        especificaciones={especificaciones}
        descargas={documentos}
        incluye={producto.includes ?? []}
      />

      <div style={{ marginTop: 32 }}>
        <h2 style={{ margin: "0 0 20px", fontSize: 26 }}>Complementa tu sistema</h2>
        <CuadriculaProductos productos={relacionados} minColumnaPx={230} />
      </div>
    </section>
  );
}
