"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductoTarjeta } from "@/lib/producto";
import { Etiqueta } from "@/components/atoms/Etiqueta";
import { Boton } from "@/components/atoms/Boton";
import { IndicadorStock } from "@/components/molecules/IndicadorStock";
import { useCarrito } from "@/components/providers/CarritoProvider";
import { useToast } from "@/components/providers/ToastProvider";

/**
 * Traducción de la tarjeta de producto que se repite en `index.html`
 * (portada l. 380-417, grupo l. 551-577, listado l. 652-687, relacionados
 * l. 829-842, búsqueda l. 1778-1793). "Agregar al pedido" reproduce
 * `Component.add()`/`Component.card().onAdd` (index.html:2015-2028,2050):
 * agrega 1 pieza al carrito y muestra el mismo aviso ("Agregado a tu
 * pedido"), acotado siempre al disponible real.
 */
export function TarjetaProducto({ producto }: { producto: ProductoTarjeta }) {
  const href = `/producto/${producto.slug}`;
  const carrito = useCarrito();
  const { mostrarToast } = useToast();
  const [agregando, setAgregando] = useState(false);

  async function agregarAlPedido() {
    setAgregando(true);
    await carrito.agregar(
      {
        productId: producto.id,
        sku: producto.sku,
        slug: producto.slug,
        name: producto.name,
        price: producto.precio,
        disponible: producto.disponible,
        imagenUrl: producto.imagenUrl,
      },
      1,
    );
    setAgregando(false);
    mostrarToast("Agregado a tu pedido");
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Link
        href={href}
        style={{
          display: "block",
          position: "relative",
          width: "100%",
          aspectRatio: "4/3",
          background: "#E7EDF2",
          overflow: "hidden",
        }}
      >
        {producto.imagenUrl ? (
          <Image
            src={producto.imagenUrl}
            alt={producto.name}
            fill
            sizes="(max-width: 640px) 50vw, 250px"
            style={{ objectFit: "cover", mixBlendMode: "luminosity", opacity: 0.85 }}
          />
        ) : (
          <span
            style={{
              position: "absolute",
              inset: 14,
              display: "grid",
              placeItems: "center",
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "#3a4a58",
              textAlign: "center",
              lineHeight: 1.5,
              background: "rgba(231,237,242,.72)",
              padding: 4,
            }}
          >
            {producto.sku}
          </span>
        )}
      </Link>

      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
            {producto.sku}
          </span>
          {producto.esUsado && <Etiqueta tono="advertencia">Usado</Etiqueta>}
        </div>

        <Link
          href={href}
          style={{
            textAlign: "left",
            fontSize: 15,
            lineHeight: 1.35,
            color: "var(--text-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {producto.name}
        </Link>

        {producto.specs.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {producto.specs.map((spec, i) => (
              <span
                key={i}
                style={{
                  padding: "3px 8px",
                  border: "1px solid var(--border)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text-muted)",
                }}
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          <span
            className="font-data"
            style={{
              display: "block",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: 23,
              color: "var(--text-primary)",
            }}
          >
            {producto.precioFmt}
          </span>
          <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            IVA incluido
          </span>
          <div style={{ marginTop: 12 }}>
            <IndicadorStock
              barras={producto.barras}
              etiqueta={producto.etiquetaStock}
              nivel={producto.nivel}
            />
          </div>
        </div>

        {producto.disponible > 0 ? (
          <Boton
            variante="primaria"
            tamano="md"
            anchoCompleto
            style={{ marginTop: 4 }}
            onClick={agregarAlPedido}
            disabled={agregando}
          >
            {agregando ? "Agregando…" : "Agregar al pedido"}
          </Boton>
        ) : (
          <div style={{ marginTop: 4 }}>
            <Boton variante="deshabilitada" tamano="md" anchoCompleto disabled>
              Agotado
            </Boton>
            <button
              type="button"
              onClick={() => mostrarToast("Te avisamos a tu correo cuando llegue")}
              style={{ display: "block", width: "100%", marginTop: 8, fontSize: 13, color: "var(--accent)", textAlign: "center" }}
            >
              Avísame cuando llegue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
