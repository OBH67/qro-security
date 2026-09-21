import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerPedidoPorFolio } from "@/server/db/queries/pedidos";
import { FormularioComprobante } from "@/components/organisms/FormularioComprobante";

export async function generateMetadata({ params }: { params: Promise<{ folio: string }> }): Promise<Metadata> {
  const { folio } = await params;
  return { title: `Subir comprobante · ${folio} — SG Querétaro` };
}
export const dynamic = "force-dynamic";

/** C2: pantalla dedicada de subida (index.html:1384-1449). */
export default async function PaginaSubirComprobante({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;

  const pedido = await obtenerPedidoPorFolio(sesion.userId, folio);
  if (!pedido) notFound();
  if (pedido.status !== "pendiente_pago" || pedido.payment_method !== "transferencia") {
    redirect(`/mi-cuenta/pedidos/${folio}`);
  }

  return (
    <section style={{ maxWidth: 820 }}>
      <FormularioComprobante orderId={pedido.id} folio={pedido.folio} total={pedido.total} />
    </section>
  );
}
