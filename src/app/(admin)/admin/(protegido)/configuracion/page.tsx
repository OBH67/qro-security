import type { Metadata } from "next";
import { obtenerConfiguracionAdmin } from "@/server/db/queries/admin/configuracion";
import { ConfiguracionForm } from "@/components/organisms/admin/ConfiguracionForm";

export const metadata: Metadata = { title: "Configuración — Panel SG Querétaro" };
export const dynamic = "force-dynamic";

/** panel-admin-maqueta.html:960-1013 (`isConfiguracion`) — traducción
 * literal. H4.1: solo `admin` (H5.1, no aparece en el menú de
 * `inventario`). */
export default async function PaginaConfiguracionAdmin() {
  const { configuracion, ultimaModificacion } = await obtenerConfiguracionAdmin();

  return (
    <div>
      <h1 className="title" style={{ fontSize: 28, margin: "0 0 18px" }}>
        Configuración
      </h1>
      <ConfiguracionForm configuracion={configuracion} ultimaModificacion={ultimaModificacion} />
    </div>
  );
}
