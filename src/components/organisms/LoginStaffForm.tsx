"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { iniciarSesionStaffAction } from "@/server/actions/admin/auth";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";

/** panel-admin-maqueta.html:78-105 (`isLogin`) — traducción literal. */
export function LoginStaffForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    const resultado = await iniciarSesionStaffAction({ email, password });
    setEnviando(false);
    if (!resultado.ok) {
      setError(resultado.error);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div style={{ width: "100%", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        <form
          onSubmit={enviar}
          className="tarjeta"
          style={{ width: 400, padding: "36px 32px", display: "flex", flexDirection: "column", gap: 22, background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--accent-wash)",
                border: "1px solid var(--accent)",
                display: "grid",
                placeItems: "center",
                color: "var(--accent)",
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: 18,
              }}
            >
              SG
            </div>
            <div className="title" style={{ fontSize: 20, marginTop: 6 }}>
              Seguridad General
            </div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: 2, color: "var(--text-muted)" }}>
              QUERÉTARO · PANEL
            </div>
          </div>

          {error && (
            <div role="alert" style={{ background: "var(--danger-tint)", border: "1px solid var(--danger)", padding: "12px 14px", fontSize: 13, color: "var(--danger-text)" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Correo electrónico</label>
            <input
              className="campo"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@sgqueretaro.com"
              autoComplete="username"
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, color: "var(--text-muted)" }}>Contraseña</label>
            <input
              className="campo"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <BotonAdmin type="submit" cargando={enviando} textoCargando="Entrando…" className="cut cut-12" style={{ width: "100%" }}>
            Entrar
          </BotonAdmin>
          <a href="/recuperar" style={{ fontSize: 14, textAlign: "center" }}>
            ¿Olvidaste tu contraseña?
          </a>
        </form>
        <div style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center" }}>
          Acceso exclusivo del personal
          <br />
          de SG Querétaro
        </div>
      </div>
    </div>
  );
}
