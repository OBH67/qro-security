import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { obtenerSesionStaff, rutaPermitidaParaRol } from "@/server/auth/roles";
import { obtenerContadoresPanel } from "@/server/db/queries/admin/panel";
import { SidebarAdmin } from "@/components/organisms/admin/SidebarAdmin";
import { PantallaAccesoDenegado } from "@/components/organisms/admin/PantallaAccesoDenegado";

/**
 * H2 (capa 2) / H5: candado real del panel. `proxy.ts` (capa 1) ya
 * garantizó que hay sesión antes de llegar aquí; esta capa nunca confía
 * en eso solo — vuelve a resolver la sesión y, además, verifica el ROL
 * (staff, no cualquier cliente autenticado) y la ruta permitida para ese
 * rol (H5.1/H5.2: `inventario` fuera de Catálogo ve una pantalla de
 * acceso denegado, no un redirect ni un error técnico).
 */
export default async function LayoutAdminProtegido({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesionStaff();
  if (!sesion) redirect("/admin/ingresar");

  const listaHeaders = await headers();
  const rutaActual = listaHeaders.get("x-pathname") ?? "/admin";
  const permitido = rutaPermitidaParaRol(rutaActual, sesion.rol);

  const contadores = await obtenerContadoresPanel();

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
      <SidebarAdmin rutaActual={rutaActual} nombre={sesion.nombre} rol={sesion.rol} contadores={contadores} />
      <div style={{ flex: 1, minWidth: 0, padding: "28px 32px 64px", maxWidth: 1400 }}>
        {permitido ? children : <PantallaAccesoDenegado />}
      </div>
    </div>
  );
}
