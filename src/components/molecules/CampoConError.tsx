import type { InputHTMLAttributes } from "react";
import { CampoTexto } from "@/components/atoms/CampoTexto";

/** index.html:930-937/978-1002 — etiqueta + campo + mensaje de error, la
 * unidad que se repite en login/registro/direcciones/datos fiscales. */
export function CampoConError({
  label,
  hint,
  error,
  ...resto
}: { label: string; hint?: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>{label}</label>
      <CampoTexto {...resto} aria-invalid={!!error} />
      {error && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--danger-text)" }}>{error}</p>}
      {!error && hint && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: "var(--text-muted)" }}>{hint}</p>}
    </div>
  );
}
