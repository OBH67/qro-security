import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerProductoAdminPorId, obtenerDatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import { FormularioProducto } from "@/components/organisms/admin/FormularioProducto";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const producto = await obtenerProductoAdminPorId(id);
  return { title: `${producto?.name ?? "Producto"} — Panel SG Querétaro` };
}

export default async function PaginaEditarProductoAdmin({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [producto, datosFormulario] = await Promise.all([obtenerProductoAdminPorId(id), obtenerDatosFormularioProducto()]);
  if (!producto) notFound();
  return <FormularioProducto producto={producto} datosFormulario={datosFormulario} />;
}
