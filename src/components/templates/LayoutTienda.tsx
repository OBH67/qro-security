import type { GrupoConNavegacion } from "@/server/db/queries/catalogo";
import { EncabezadoSitio } from "@/components/organisms/EncabezadoSitio";
import { PiePagina } from "@/components/organisms/PiePagina";
import { BotonAsesorFlotante } from "@/components/organisms/BotonAsesorFlotante";

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
      {/* El encabezado es `position:fixed` (EncabezadoSitio.tsx, punto 2 de
          su comentario de cabecera) y se sobrepone al contenido — este
          padding-top compensa su altura real, medida por el propio
          encabezado con ResizeObserver y expuesta como variable CSS. El
          valor de respaldo (104px) es la altura del demo en escritorio
          (index.html:1880, `hdrH: 104`) para el primer render antes de
          medir. */}
      <main style={{ flex: 1, paddingTop: "var(--header-height, 104px)" }}>{children}</main>
      <PiePagina grupos={grupos} />
      <BotonAsesorFlotante />
    </div>
  );
}
