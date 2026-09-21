"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { esquemaLogin } from "@/lib/esquemas/registro";
import { iniciarSesion } from "@/server/actions/cuenta";
import { CampoConError } from "@/components/molecules/CampoConError";
import { Boton } from "@/components/atoms/Boton";
import { useCarrito } from "@/components/providers/CarritoProvider";

/** index.html:925-948 (`isLogin`) — login literal + fusión de carrito local
 * (§9.6) y redirección igual al demo: si hay algo en el carrito va a pagar,
 * si no, a Mis pedidos (index.html:2565: `this.go(s.cart.length ?
 * 'checkout' : 'account')`). */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const carrito = useCarrito();
  const [datos, setDatos] = useState({ email: "", password: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErrorGeneral(null);
    const parseo = esquemaLogin.safeParse(datos);
    if (!parseo.success) {
      setErrores(Object.fromEntries(parseo.error.issues.map((i) => [String(i.path[0]), i.message])));
      return;
    }
    setErrores({});
    setEnviando(true);
    const resultado = await iniciarSesion(parseo.data);
    if (!resultado.ok) {
      setErrorGeneral(resultado.error);
      setEnviando(false);
      return;
    }
    await carrito.fusionarTrasLogin();
    const siguiente = params.get("siguiente");
    router.push(siguiente || (carrito.cantidadTotal > 0 ? "/pagar" : "/mi-cuenta/pedidos"));
    router.refresh();
  }

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 28, maxWidth: 420 }}>
      <CampoConError
        label="Correo electrónico"
        type="email"
        placeholder="mariana.lopez@correo.com"
        value={datos.email}
        onChange={(e) => setDatos((d) => ({ ...d, email: e.target.value }))}
        error={errores.email}
      />
      <CampoConError
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={datos.password}
        onChange={(e) => setDatos((d) => ({ ...d, password: e.target.value }))}
        error={errores.password}
      />
      <a href="/recuperar" style={{ alignSelf: "flex-start", fontSize: 13.5, color: "var(--accent)" }}>
        ¿Olvidaste tu contraseña?
      </a>
      {errorGeneral && <p style={{ margin: 0, fontSize: 13.5, color: "var(--danger-text)" }}>{errorGeneral}</p>}
      <Boton type="submit" tamano="lg" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Boton>
    </form>
  );
}
