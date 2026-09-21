import type { Metadata } from "next";
import { LoginForm } from "@/components/organisms/LoginForm";
import { Boton } from "@/components/atoms/Boton";

export const metadata: Metadata = { title: "Iniciar sesión — SG Querétaro" };

/** index.html:925-948 (`isLogin`) — traducción literal. */
export default function PaginaIngresar() {
  return (
    <section
      style={{
        maxWidth: "var(--content-max-width)",
        margin: "0 auto",
        padding: "56px 20px 90px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: 48,
        alignItems: "start",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <h1 style={{ margin: 0, fontSize: "clamp(28px,3vw,40px)" }}>Iniciar sesión</h1>
        <LoginForm />
      </div>
      <div style={{ padding: 28, border: "1px solid var(--border)", background: "var(--bg-card)", maxWidth: 460 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>¿Primera compra?</h2>
        <p style={{ margin: "12px 0 0", fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)" }}>
          Para generar tu pedido necesitas una cuenta. Así guardamos tu dirección de envío y tus datos de contacto.
        </p>
        <div style={{ marginTop: 20 }}>
          <Boton href="/registro" variante="secundaria" tamano="md">
            Crear cuenta
          </Boton>
        </div>
      </div>
    </section>
  );
}
