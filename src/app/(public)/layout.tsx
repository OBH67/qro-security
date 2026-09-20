import { obtenerNavegacionGrupos } from "@/server/db/queries/catalogo";
import { LayoutTienda } from "@/components/templates/LayoutTienda";

// La navegación (6 grupos + subcategorías de primer nivel) se usa en el
// encabezado y el pie en todas las páginas públicas — se resuelve una sola
// vez aquí y se pasa hacia abajo.
export default async function LayoutPublico({
  children,
}: {
  children: React.ReactNode;
}) {
  const grupos = await obtenerNavegacionGrupos();
  return <LayoutTienda grupos={grupos}>{children}</LayoutTienda>;
}
