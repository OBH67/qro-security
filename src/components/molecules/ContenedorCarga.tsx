/** Envoltura común de los `loading.tsx`: anuncia la carga a lectores de
 * pantalla y aplica el retraso anti-parpadeo de `.sg-carga`. */
export function ContenedorCarga({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="sg-carga" role="status" aria-live="polite" style={style}>
      <span className="sr-only">Cargando…</span>
      {children}
    </div>
  );
}
