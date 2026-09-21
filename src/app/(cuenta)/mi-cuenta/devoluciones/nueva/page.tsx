import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerPedidosElegiblesParaDevolucion } from "@/server/db/queries/devoluciones";
import { FormularioNuevaDevolucion } from "@/components/organisms/FormularioNuevaDevolucion";

export const metadata: Metadata = { title: "Solicitar devolución — SG Querétaro" };
export const dynamic = "force-dynamic";

export default async function PaginaNuevaDevolucion() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;

  const pedidos = await obtenerPedidosElegiblesParaDevolucion(sesion.userId);

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Solicitar devolución</h1>
      <FormularioNuevaDevolucion pedidos={pedidos} />
    </div>
  );
}
