import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerDireccionesDeCliente } from "@/server/db/queries/cuenta";
import { DireccionesCliente } from "./DireccionesCliente";

export const metadata: Metadata = { title: "Direcciones — SG Querétaro" };
export const dynamic = "force-dynamic";

export default async function PaginaDirecciones() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;
  const direcciones = await obtenerDireccionesDeCliente(sesion.userId);

  return (
    <div>
      <h1 className="cuenta-escritorio-solo" style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Direcciones</h1>
      <DireccionesCliente direcciones={direcciones} />
    </div>
  );
}
