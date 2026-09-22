import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerDatosFiscalesDeCliente } from "@/server/db/queries/cuenta";
import { DatosFiscalesCliente } from "./DatosFiscalesCliente";

export const metadata: Metadata = { title: "Datos de facturación — SG Querétaro" };
export const dynamic = "force-dynamic";

export default async function PaginaDatosFiscales() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;
  const registros = await obtenerDatosFiscalesDeCliente(sesion.userId);

  return (
    <div>
      <h1 className="cuenta-escritorio-solo" style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Datos de facturación</h1>
      <DatosFiscalesCliente registros={registros} />
    </div>
  );
}
