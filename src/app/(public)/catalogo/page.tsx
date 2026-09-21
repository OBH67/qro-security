import { redirect, notFound } from "next/navigation";
import { obtenerGrupos } from "@/server/db/queries/catalogo";

/**
 * `/catalogo` sin grupo no es una pantalla del demo (`index.html` no tiene
 * un "todos los grupos" fuera de la portada) — pero varios componentes ya
 * enlazaban aquí (`EncabezadoSitio.tsx`, carrito vacío, "Mis pedidos"
 * vacío) sin que la ruta existiera, dando 404. Mismo criterio que ya usa
 * el mega-menú para "Promociones" (`grupos[1] ? .../todos : "/catalogo"`):
 * ir al primer grupo real en vez de inventar una pantalla nueva.
 */
export default async function PaginaCatalogoRaiz() {
  const grupos = await obtenerGrupos();
  if (grupos.length === 0) notFound();
  redirect(`/catalogo/${grupos[0].slug}/todos`);
}
