import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";

export const metadata: Metadata = { title: "Mis datos — SG Querétaro" };
export const dynamic = "force-dynamic";

/** index.html:1254-1261 (`secDatos`) — de solo lectura; editar el perfil no
 * es un criterio de B2/B3 de este incremento. */
export default async function PaginaMisDatos() {
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;

  return (
    <div>
      <h1 style={{ margin: "0 0 24px", fontSize: "clamp(26px,2.6vw,34px)" }}>Mis datos</h1>
      <div style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, maxWidth: 620, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20 }}>
        <Dato etiqueta="Nombre" valor={`${sesion.perfil.first_name} ${sesion.perfil.last_name}`} />
        <Dato etiqueta="Correo" valor={sesion.email} />
        <Dato etiqueta="Celular" valor={sesion.perfil.phone} mono />
        <Dato etiqueta="Correo verificado" valor={sesion.perfil.email_verified ? "Sí" : "Pendiente de verificar"} />
      </div>
    </div>
  );
}

function Dato({ etiqueta, valor, mono }: { etiqueta: string; valor: string; mono?: boolean }) {
  return (
    <div>
      <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)" }}>{etiqueta}</span>
      <span className={mono ? "font-data" : undefined} style={{ display: "block", marginTop: 5, fontSize: 16 }}>{valor}</span>
    </div>
  );
}
