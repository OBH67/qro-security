import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";

/** Carrito en base de datos (§9.6): mismo cliente con sesión que
 * `queries/carrito.ts` — RLS `carts_own`/`cart_items_own` ya garantiza
 * "solo lo propio", no hace falta `service_role`. */

async function obtenerOCrearCarrito(userId: string): Promise<string> {
  const supabase = await crearClienteServidor();
  const { data: existente, error: errorLectura } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (errorLectura) throw new Error(`No se pudo abrir tu carrito: ${errorLectura.message}`);
  if (existente) return existente.id;

  const { data: creado, error: errorCreacion } = await supabase
    .from("carts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (errorCreacion) throw new Error(`No se pudo crear tu carrito: ${errorCreacion.message}`);
  return creado.id;
}

async function disponibleDeProducto(productId: string): Promise<number> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("catalogo_productos")
    .select("disponible")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(`No se pudo verificar el producto: ${error.message}`);
  return data?.disponible ?? 0;
}

/** B1.1/B1.3: agrega o suma cantidad, acotada siempre al disponible actual
 * (nunca al que tenía cuando se abrió la pantalla). */
export async function agregarAlCarrito(userId: string, productId: string, qty: number): Promise<void> {
  const supabase = await crearClienteServidor();
  const cartId = await obtenerOCrearCarrito(userId);
  const disponible = await disponibleDeProducto(productId);
  if (disponible <= 0) throw new Error("Este producto ya no tiene piezas disponibles.");

  const { data: existente, error: errorLectura } = await supabase
    .from("cart_items")
    .select("qty")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();
  if (errorLectura) throw new Error(`No se pudo revisar tu carrito: ${errorLectura.message}`);

  const nuevaCantidad = Math.min(disponible, (existente?.qty ?? 0) + qty);

  const { error } = await supabase
    .from("cart_items")
    .upsert({ cart_id: cartId, product_id: productId, qty: nuevaCantidad }, { onConflict: "cart_id,product_id" });
  if (error) throw new Error(`No se pudo agregar el producto: ${error.message}`);

  await supabase.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cartId);
}

export async function actualizarCantidadCarrito(userId: string, productId: string, qty: number): Promise<void> {
  if (qty <= 0) return quitarDelCarrito(userId, productId);
  const supabase = await crearClienteServidor();
  const cartId = await obtenerOCrearCarrito(userId);
  const disponible = await disponibleDeProducto(productId);
  const nuevaCantidad = Math.max(1, Math.min(disponible, qty));

  const { error } = await supabase
    .from("cart_items")
    .update({ qty: nuevaCantidad })
    .eq("cart_id", cartId)
    .eq("product_id", productId);
  if (error) throw new Error(`No se pudo actualizar la cantidad: ${error.message}`);
}

export async function quitarDelCarrito(userId: string, productId: string): Promise<void> {
  const supabase = await crearClienteServidor();
  const cartId = await obtenerOCrearCarrito(userId);
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cartId).eq("product_id", productId);
  if (error) throw new Error(`No se pudo quitar el producto: ${error.message}`);
}

/** Fusiona el carrito local (visitante sin sesión, `localStorage`) con el
 * de base de datos al iniciar sesión — arquitectura §9.6: "se suman
 * cantidades y se acota al stock disponible, no se pisa". */
export async function fusionarCarritoLocal(
  userId: string,
  itemsLocales: { productId: string; qty: number }[],
): Promise<void> {
  for (const item of itemsLocales) {
    try {
      await agregarAlCarrito(userId, item.productId, item.qty);
    } catch {
      // Un producto desactivado o agotado entre que se guardó localmente y
      // el login no debe tumbar la fusión completa de los demás.
    }
  }
}
