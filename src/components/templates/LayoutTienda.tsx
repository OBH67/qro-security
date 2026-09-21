import type { GrupoConNavegacion } from "@/server/db/queries/catalogo";
import { EncabezadoSitio } from "@/components/organisms/EncabezadoSitio";
import { PiePagina } from "@/components/organisms/PiePagina";

/** Esqueleto del sitio público: encabezado + contenido + pie
 * (arquitectura.md §4.1, `templates/` "el esqueleto de una pantalla, sin
 * datos reales" — aquí solo recibe la navegación ya resuelta). */
export function LayoutTienda({
  grupos,
  sesion,
  children,
}: {
  grupos: GrupoConNavegacion[];
  sesion: { nombre: string } | null;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <EncabezadoSitio grupos={grupos} sesion={sesion} />
      <main style={{ flex: 1 }}>{children}</main>
      <PiePagina grupos={grupos} />
    </div>
  );
}
