import type { Metadata } from "next";
import { obtenerDatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import { AsistenteNuevoProducto } from "@/components/organisms/admin/AsistenteNuevoProducto";

export const metadata: Metadata = { title: "Nuevo producto — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevoProductoAdmin() {
  const datosFormulario = await obtenerDatosFormularioProducto();
  return <AsistenteNuevoProducto datosFormulario={datosFormulario} />;
}
