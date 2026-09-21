import type { ProductoTarjeta } from "@/lib/producto";
import { TarjetaProducto } from "@/components/molecules/TarjetaProducto";
import { Boton } from "@/components/atoms/Boton";

/** index.html:644-690 — cuadrícula de resultados + estado vacío. */
export function CuadriculaProductos({
  productos,
  minColumnaPx = 240,
  vacio,
}: {
  productos: ProductoTarjeta[];
  minColumnaPx?: number;
  vacio?: { titulo: string; hrefAccion: string; textoAccion: string };
}) {
  if (productos.length === 0 && vacio) {
    return (
      <div
        style={{
          padding: "70px 20px",
          textAlign: "center",
          border: "1px dashed var(--border)",
          marginTop: 24,
        }}
      >
        <p style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 22 }}>
          {vacio.titulo}
        </p>
        <div style={{ marginTop: 18, display: "flex", justifyContent: "center" }}>
          <Boton href={vacio.hrefAccion} variante="secundaria">
            {vacio.textoAccion}
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fill, minmax(${minColumnaPx}px, 1fr))`,
        gap: 18,
        marginTop: 22,
      }}
    >
      {productos.map((producto) => (
        <TarjetaProducto key={producto.id} producto={producto} />
      ))}
    </div>
  );
}
