import "./admin.css";

/** H1-bis: layout compartido de todo el grupo `(admin)` — solo aplica el
 * CSS de la maqueta (`admin.css`), sin candado de sesión (eso vive en
 * `admin/(protegido)/layout.tsx`, para que `/admin/ingresar` no quede
 * atrapado detrás de su propio candado). */
export default function LayoutAdminRaiz({ children }: { children: React.ReactNode }) {
  return <div className="admin-root">{children}</div>;
}
