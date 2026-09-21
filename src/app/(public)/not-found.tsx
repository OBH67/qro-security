import { Boton } from "@/components/atoms/Boton";

/** index.html:1798-1810 — pantalla 404. Se dispara cuando `notFound()` se
 * llama en cualquier página pública (ej. producto o categoría inexistente
 * — criterio A1.4: un producto inactivo no aparece ni por URL directa). */
export default function NoEncontrado() {
  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: "70px 20px 110px", textAlign: "center" }}>
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          maxWidth: 620,
          margin: "0 auto",
          border: "1px solid var(--border)",
          background: "var(--bg-surface)",
          display: "grid",
          placeItems: "center",
        }}
      >
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "clamp(40px,7vw,80px)", color: "var(--border)" }}>
          404
        </span>
      </div>
      <h1 style={{ margin: "34px 0 0", fontSize: "clamp(24px,2.6vw,34px)" }}>Esta página no tiene señal</h1>
      <p style={{ margin: "12px auto 0", maxWidth: "50ch", fontSize: 16, lineHeight: 1.6, color: "var(--text-muted)" }}>
        La dirección que buscas no existe o se movió. Revisa el catálogo o escríbele a un asesor.
      </p>
      <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
        <Boton href="/" variante="primaria" tamano="lg">
          Volver al inicio
        </Boton>
      </div>
    </section>
  );
}
