"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SelectorCantidad } from "@/components/molecules/SelectorCantidad";
import { Boton } from "@/components/atoms/Boton";
import { useCarrito } from "@/components/providers/CarritoProvider";

/** index.html:826-841 (botones "Agregar al pedido" / "Comprar ahora" de la
 * ficha de producto) conectados al carrito real (B1.1) — el demo no tenía
 * carrito, así que el cableado es nuevo, pero la forma de los botones es
 * literal. */
export function AgregarAlPedido({
  producto,
}: {
  producto: { productId: string; sku: string; slug: string; name: string; price: number; disponible: number; imagenUrl: string | null };
}) {
  const router = useRouter();
  const carrito = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [agregando, setAgregando] = useState<"agregar" | "comprar" | null>(null);

  async function agregar() {
    setAgregando("agregar");
    await carrito.agregar(producto, cantidad);
    setAgregando(null);
  }

  async function comprarAhora() {
    setAgregando("comprar");
    await carrito.agregar(producto, cantidad);
    setAgregando(null);
    router.push("/carrito");
  }

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 26 }}>
      <SelectorCantidad maximo={producto.disponible} valor={cantidad} onChange={setCantidad} />
      <Boton
        variante="primaria"
        tamano="lg"
        onClick={agregar}
        disabled={agregando === "comprar"}
        cargando={agregando === "agregar"}
        textoCargando="Agregando…"
      >
        Agregar al pedido
      </Boton>
      <Boton
        variante="secundaria"
        tamano="lg"
        onClick={comprarAhora}
        disabled={agregando === "agregar"}
        cargando={agregando === "comprar"}
        textoCargando="Un momento…"
      >
        Comprar ahora
      </Boton>
    </div>
  );
}
