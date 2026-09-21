import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import { calcularSubtotal } from "@/server/domain/precios";
import type { ItemCarritoResuelto } from "@/types/database";

/** Carrito de un cliente con sesión (B1.2: sobrevive al cambio de
 * dispositivo — arquitectura §9.6). Siempre resuelve contra el producto
 * VIVO: el carrito guarda intención (SKU + cantidad), nunca el precio
 * (B1.3/B1.4, RN-10 — el precio se congela hasta generar el pedido, no
 * antes). */
export async function obtenerCarritoResuelto(userId: string): Promise<{
  items: ItemCarritoResuelto[];
  subtotal: number;
  cantidadTotal: number;
  algunoConProblemaDeStock: boolean;
}> {
  const supabase = await crearClienteServidor();

  const { data: carrito, error: errorCarrito } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (errorCarrito) throw new Error(`No se pudo cargar tu carrito: ${errorCarrito.message}`);
  if (!carrito) return { items: [], subtotal: 0, cantidadTotal: 0, algunoConProblemaDeStock: false };

  const { data: renglones, error: errorRenglones } = await supabase
    .from("cart_items")
    .select("product_id, qty")
    .eq("cart_id", carrito.id);
  if (errorRenglones) throw new Error(`No se pudieron cargar tus productos: ${errorRenglones.message}`);
  if (!renglones || renglones.length === 0) {
    return { items: [], subtotal: 0, cantidadTotal: 0, algunoConProblemaDeStock: false };
  }

  const productIds = renglones.map((r) => r.product_id);
  const { data: productos, error: errorProductos } = await supabase
    .from("catalogo_productos")
    .select("id, sku, slug, name, price, stock, reserved, disponible")
    .in("id", productIds);
  if (errorProductos) throw new Error(`No se pudieron cargar los productos del carrito: ${errorProductos.message}`);

  const { data: imagenes } = await supabase
    .from("product_images")
    .select("product_id, url, position")
    .in("product_id", productIds)
    .order("position", { ascending: true });
  const imagenPrincipal = new Map<string, string>();
  for (const img of imagenes ?? []) {
    if (!imagenPrincipal.has(img.product_id)) imagenPrincipal.set(img.product_id, img.url);
  }

  const porId = new Map((productos ?? []).map((p) => [p.id, p]));

  const items: ItemCarritoResuelto[] = [];
  for (const renglon of renglones) {
    const producto = porId.get(renglon.product_id);
    // El producto se desactivó o se borró (no debería con RN-9, pero el
    // carrito puede tener una intención vieja): se omite de la lista, sin
    // reventar la pantalla — no hay nada que mostrar de un producto que
    // ya no existe en el catálogo público.
    if (!producto) continue;
    items.push({
      productId: producto.id,
      sku: producto.sku,
      slug: producto.slug,
      name: producto.name,
      price: Number(producto.price),
      qty: renglon.qty,
      disponible: producto.disponible,
      imagenUrl: imagenPrincipal.get(producto.id) ?? null,
      stockCambio: renglon.qty > producto.disponible,
    });
  }

  return {
    items,
    subtotal: calcularSubtotal(items),
    cantidadTotal: items.reduce((acc, it) => acc + it.qty, 0),
    algunoConProblemaDeStock: items.some((it) => it.stockCambio),
  };
}
