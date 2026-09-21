"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatearPrecio } from "@/lib/formato";
import { useCarrito } from "@/components/providers/CarritoProvider";
import { SelectorCantidad } from "@/components/molecules/SelectorCantidad";
import { Boton } from "@/components/atoms/Boton";

/** index.html:859-923 (`isCart`) — traducción literal. */
export default function PaginaCarrito() {
  const carrito = useCarrito();
  const router = useRouter();

  if (carrito.cargando) {
    return <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "36px 20px 80px" }} />;
  }

  return (
    <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "36px 20px 80px" }}>
      <h1 style={{ margin: "0 0 6px", fontSize: "clamp(28px,3vw,40px)" }}>Mi pedido</h1>
      <p style={{ margin: "0 0 28px", color: "var(--text-muted)", fontSize: 15 }}>
        {carrito.cantidadTotal === 1 ? "1 producto" : `${carrito.cantidadTotal} productos`}
      </p>

      {carrito.items.length === 0 ? (
        <div style={{ padding: "80px 20px", textAlign: "center", border: "1px dashed var(--border-subtle)" }}>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 24 }}>Tu pedido está vacío</p>
          <div style={{ marginTop: 20 }}>
            <Boton href="/catalogo">Ver catálogo</Boton>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 32, alignItems: "start" }} className="carrito-grid">
          <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            {carrito.items.map((it) => (
              <div key={it.productId} style={{ display: "flex", gap: 18, padding: 20, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
                <span style={{ width: 104, height: 104, flex: "0 0 auto", background: "#E7EDF2", display: "grid", placeItems: "center", overflow: "hidden" }}>
                  {it.imagenUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.imagenUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "luminosity", opacity: 0.85 }} />
                  ) : (
                    <span className="font-data" style={{ fontSize: 9, color: "#6B7D8C", textAlign: "center", lineHeight: 1.4 }}>{it.sku}</span>
                  )}
                </span>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <Link href={`/producto/${it.slug}`} style={{ fontSize: 16, lineHeight: 1.4, color: "var(--text-primary)" }}>
                    {it.name}
                  </Link>
                  <p className="font-data" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
                    {it.sku} · {it.disponible} disponibles
                  </p>
                  {it.stockCambio && (
                    <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--warning)" }}>
                      Solo quedan {it.disponible} piezas — ajustamos tu cantidad.
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
                    <SelectorCantidad
                      maximo={it.disponible}
                      valor={it.qty}
                      onChange={(qty) => carrito.actualizarCantidad(it.productId, qty)}
                      tamano="compacto"
                    />
                    <button type="button" onClick={() => carrito.quitar(it.productId)} style={{ fontSize: 14, color: "var(--text-muted)" }}>
                      Quitar
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 120 }}>
                  <span className="font-data" style={{ display: "block", fontSize: 22, fontWeight: 600 }}>{formatearPrecio(it.price * it.qty)}</span>
                  <span style={{ display: "block", fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{formatearPrecio(it.price)} c/u</span>
                </div>
              </div>
            ))}
            <div style={{ padding: "18px 20px" }}>
              <Link href="/catalogo" style={{ fontSize: 14, color: "var(--accent)" }}>Seguir comprando</Link>
            </div>
          </div>

          <aside style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, position: "sticky", top: 96 }}>
            <h2 style={{ margin: "0 0 18px", fontSize: 20 }}>Resumen</h2>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, color: "var(--text-muted)", padding: "9px 0" }}>
              <span>Subtotal</span>
              <span className="font-data" style={{ color: "var(--text-primary)" }}>{formatearPrecio(carrito.subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 15, color: "var(--text-muted)", padding: "9px 0", borderBottom: "1px solid var(--border)" }}>
              <span>Envío</span>
              <span style={{ fontSize: 13.5, textAlign: "right" }}>Se confirma con tu asesor</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0 4px" }}>
              <span style={{ fontSize: 17 }}>Total</span>
              <span className="font-data" style={{ fontSize: 28, fontWeight: 600 }}>{formatearPrecio(carrito.subtotal)}</span>
            </div>
            <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "var(--text-muted)" }}>IVA incluido</p>
            <Boton
              anchoCompleto
              tamano="lg"
              disabled={carrito.algunoConProblemaDeStock}
              onClick={() => router.push(carrito.sesionIniciada ? "/pagar" : "/ingresar")}
            >
              Continuar con mi pedido
            </Boton>
            {carrito.algunoConProblemaDeStock && (
              <p style={{ margin: "14px 0 0", fontSize: 13, color: "var(--warning)" }}>
                Ajusta las cantidades marcadas arriba antes de continuar.
              </p>
            )}
            {!carrito.sesionIniciada && (
              <p style={{ margin: "16px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
                Para generar tu pedido necesitas una cuenta. Así guardamos tu dirección de envío y tus datos de contacto.
              </p>
            )}
          </aside>
        </div>
      )}
      <style>{`
        @media (max-width: 899px) { .carrito-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  );
}
