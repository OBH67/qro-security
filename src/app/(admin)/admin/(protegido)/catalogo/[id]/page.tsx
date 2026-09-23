import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerProductoAdminPorId, obtenerDatosFormularioProducto } from "@/server/db/queries/admin/catalogo";
import { obtenerGaleriaProducto, obtenerDocumentosProducto, obtenerAtributosDeCategoria } from "@/server/db/queries/catalogo";
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

  // Fotos/documentos/atributos (pestañas "Fotos"/"Documentos"/
  // "Especificaciones", F1.4) solo aplican a un producto ya guardado —
  // aquí siempre lo está, por eso se cargan de una vez junto con el resto.
  const [galeria, documentos, atributosDeCategoria] = await Promise.all([
    obtenerGaleriaProducto(producto.id),
    obtenerDocumentosProducto(producto.id),
    obtenerAtributosDeCategoria({ groupId: producto.group_id, subcategoryId: producto.subcategory_id }),
  ]);

  return (
    <FormularioProducto
      producto={producto}
      datosFormulario={datosFormulario}
      galeriaInicial={galeria}
      documentosIniciales={documentos}
      atributosDeCategoria={atributosDeCategoria}
    />
  );
}
