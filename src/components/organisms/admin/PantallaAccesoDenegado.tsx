import Link from "next/link";

/** panel-admin-maqueta.html:152-160 — traducción literal. H5.2: "en
 * español de negocio, no un error técnico". */
export function PantallaAccesoDenegado() {
  return (
    <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--warning-tint)", border: "1px solid var(--warning)", display: "grid", placeItems: "center", color: "var(--warning)", fontSize: 24 }}>!</div>
      <div className="title" style={{ fontSize: 24 }}>
        Esta sección no es parte de tu acceso
      </div>
      <div style={{ fontSize: 15, color: "var(--text-secondary)", lineHeight: 1.55 }}>
        Tu cuenta tiene permiso para administrar el catálogo. Si necesitas ver pedidos, pídeselo al administrador.
      </div>
      <Link href="/admin/catalogo" className="btn btn-primario cut cut-12">
        Ir a Catálogo
      </Link>
    </div>
  );
}
