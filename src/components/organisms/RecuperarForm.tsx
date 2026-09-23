"use client";

import { useState } from "react";
import { esquemaRecuperar } from "@/lib/esquemas/registro";
import { solicitarRecuperacion } from "@/server/actions/cuenta";
import { CampoConError } from "@/components/molecules/CampoConError";
import { Boton } from "@/components/atoms/Boton";

/** B2.4: recuperación de contraseña por correo. No está en `index.html`
 * (el demo solo tiene el enlace "¿Olvidaste tu contraseña?" con un
 * mensaje simulado, index.html:2568) — la pantalla completa sigue la
 * misma forma visual de login/registro por consistencia, ya que
 * `diseño.md` tampoco la especifica (es parte del sitio público, fuera de
 * su alcance) y el criterio B2.4 la exige. */
export function RecuperarForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const parseo = esquemaRecuperar.safeParse({ email });
    if (!parseo.success) {
      setError(parseo.error.issues[0]?.message ?? "Escribe un correo válido.");
      return;
    }
    setError(null);
    setEnviando(true);
    await solicitarRecuperacion(parseo.data);
    setEnviando(false);
    setEnviado(true);
  }

  if (enviado) {
    return (
      <p style={{ margin: "20px 0 0", fontSize: 15.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
        Si ese correo tiene una cuenta con nosotros, te enviamos un enlace para restablecer tu contraseña.
      </p>
    );
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 28, maxWidth: 420 }}>
      <CampoConError
        label="Correo electrónico"
        type="email"
        placeholder="mariana.lopez@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error ?? undefined}
      />
      <Boton type="submit" tamano="lg" cargando={enviando} textoCargando="Enviando…">
        Enviar enlace de recuperación
      </Boton>
    </form>
  );
}
