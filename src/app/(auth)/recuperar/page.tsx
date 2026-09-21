import type { Metadata } from "next";
import { RecuperarForm } from "@/components/organisms/RecuperarForm";

export const metadata: Metadata = { title: "Recuperar contraseña — SG Querétaro" };

export default function PaginaRecuperar() {
  return (
    <section style={{ maxWidth: 460, margin: "0 auto", padding: "56px 20px 90px" }}>
      <h1 style={{ margin: 0, fontSize: "clamp(28px,3vw,40px)" }}>Recuperar contraseña</h1>
      <p style={{ margin: "12px 0 0", fontSize: 15, color: "var(--text-muted)" }}>
        Escribe tu correo y te enviamos un enlace para elegir una contraseña nueva.
      </p>
      <RecuperarForm />
    </section>
  );
}
