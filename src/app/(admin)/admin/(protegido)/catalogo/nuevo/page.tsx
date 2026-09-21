import type { Metadata } from "next";
import { obtenerDatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import { FormularioProducto } from "@/components/organisms/admin/FormularioProducto";

export const metadata: Metadata = { title: "Nuevo producto — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevoProductoAdmin() {
  const datosFormulario = await obtenerDatosFormularioProducto();
  return <FormularioProducto datosFormulario={datosFormulario} />;
}
