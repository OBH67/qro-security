"use server";

import { revalidatePath } from "next/cache";
import { obtenerCarritoResuelto } from "@/server/db/queries/carrito";
import { agregarAlCarrito, actualizarCantidadCarrito, quitarDelCarrito, fusionarCarritoLocal } from "@/server/db/mutations/carrito";
import { accion, conSesion, type ResultadoAction } from "@/server/actions/_guard";
import { crearClienteServidor } from "@/server/supabase/server";
import type { ItemCarritoResuelto } from "@/types/database";

/** B1: el carrito con sesión vive en base de datos (§9.6). Un visitante
 * sin sesión usa `localStorage` del lado del cliente — estas acciones solo
 * aplican cuando hay sesión iniciada. */

export interface CarritoResuelto {
  items: ItemCarritoResuelto[];
  subtotal: number;
  cantidadTotal: number;
  algunoConProblemaDeStock: boolean;
}

export async function obtenerCarritoAction(): Promise<ResultadoAction<CarritoResuelto>> {
  return conSesion(async (sesion) => obtenerCarritoResuelto(sesion.userId));
}

export async function agregarAlCarritoAction(productId: string, qty: number): Promise<ResultadoAction<CarritoResuelto>> {
  return conSesion(async (sesion) => {
    await agregarAlCarrito(sesion.userId, productId, qty);
    revalidatePath("/carrito");
    return obtenerCarritoResuelto(sesion.userId);
  });
}

export async function actualizarCantidadCarritoAction(productId: string, qty: number): Promise<ResultadoAction<CarritoResuelto>> {
  return conSesion(async (sesion) => {
    await actualizarCantidadCarrito(sesion.userId, productId, qty);
    revalidatePath("/carrito");
    return obtenerCarritoResuelto(sesion.userId);
  });
}

export async function quitarDelCarritoAction(productId: string): Promise<ResultadoAction<CarritoResuelto>> {
  return conSesion(async (sesion) => {
    await quitarDelCarrito(sesion.userId, productId);
    revalidatePath("/carrito");
    return obtenerCarritoResuelto(sesion.userId);
  });
}

/** Se llama justo después de iniciar sesión con productos ya en
 * `localStorage` (visitante que armó su pedido sin cuenta) — arquitectura
 * §9.6: se fusiona, no se pisa. */
/** Para el carrito de un VISITANTE sin sesión (`localStorage`, §9.6): el
 * cliente solo guarda `productId` + `qty`; esta acción pública (sin
 * sesión, mismo criterio de lectura que el catálogo) trae el precio y el
 * disponible ACTUALES, para nunca confiar en lo que el navegador cacheó. */
export async function resolverProductosPublicosAction(
  productIds: string[],
): Promise<ResultadoAction<Pick<ItemCarritoResuelto, "productId" | "sku" | "slug" | "name" | "price" | "disponible" | "imagenUrl">[]>> {
  return accion(async () => {
    if (productIds.length === 0) return [];
    const supabase = await crearClienteServidor();
    const { data: productos, error } = await supabase
      .from("catalogo_productos")
      .select("id, sku, slug, name, price, disponible")
      .in("id", productIds);
    if (error) throw new Error(`No se pudieron cargar los productos: ${error.message}`);

    const { data: imagenes } = await supabase
      .from("product_images")
      .select("product_id, url, position")
      .in("product_id", productIds)
      .order("position", { ascending: true });
    const imagenPrincipal = new Map<string, string>();
    for (const img of imagenes ?? []) {
      if (!imagenPrincipal.has(img.product_id)) imagenPrincipal.set(img.product_id, img.url);
    }

    return (productos ?? []).map((p) => ({
      productId: p.id,
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      price: Number(p.price),
      disponible: p.disponible,
      imagenUrl: imagenPrincipal.get(p.id) ?? null,
    }));
  });
}

export async function fusionarCarritoAction(
  itemsLocales: { productId: string; qty: number }[],
): Promise<ResultadoAction<CarritoResuelto>> {
  return conSesion(async (sesion) => {
    if (itemsLocales.length > 0) await fusionarCarritoLocal(sesion.userId, itemsLocales);
    revalidatePath("/carrito");
    return obtenerCarritoResuelto(sesion.userId);
  });
}
