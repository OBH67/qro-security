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
      {/* El encabezado es `position:relative` (EncabezadoSitio.tsx) — va
          con el contenido en el flujo normal, sin necesidad de compensar
          nada con padding. Lo único `position:fixed` es la barra flotante
          compacta, que se sobrepone transitoriamente al hacer scroll hacia
          arriba (mismo comportamiento que el demo, sin compensación). */}
      <main style={{ flex: 1 }}>{children}</main>
      <PiePagina grupos={grupos} />
      <BotonAsesorFlotante />
    </div>
  );
}
