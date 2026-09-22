import { obtenerNavegacionGrupos } from "@/server/db/queries/catalogo";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { LayoutTienda } from "@/components/templates/LayoutTienda";
import { CarritoProvider } from "@/components/providers/CarritoProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { CicloHeroProvider } from "@/components/providers/CicloHeroProvider";

/** El demo (`index.html`) es una sola página: el encabezado y el pie
 * persisten en TODAS las pantallas, incluidas login/registro/checkout/mi
 * cuenta (no solo el catálogo). Este envoltorio evita repetir la misma
 * resolución de grupos + sesión en cada `layout.tsx` de cada grupo de
 * rutas ((public), (auth), (cuenta)). */
export async function SitioConChrome({ children }: { children: React.ReactNode }) {
  const [grupos, sesion] = await Promise.all([obtenerNavegacionGrupos(), obtenerSesionActual()]);
  return (
    <ToastProvider>
      <CarritoProvider sesionIniciada={!!sesion}>
        <CicloHeroProvider>
          <LayoutTienda grupos={grupos} sesion={sesion ? { nombre: sesion.perfil.first_name } : null}>
            {children}
          </LayoutTienda>
        </CicloHeroProvider>
      </CarritoProvider>
    </ToastProvider>
  );
}
