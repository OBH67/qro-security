import { Salto } from "@/components/atoms/Salto";
import { ContenedorCarga } from "@/components/molecules/ContenedorCarga";

export default function CargandoPublico() {
  return (
    <ContenedorCarga style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "28px 20px 80px" }}>
      <Salto ancho={180} alto={12} style={{ marginBottom: 22 }} />
      <Salto ancho="min(420px, 80%)" alto={34} />
      <Salto ancho="min(620px, 95%)" alto={14} style={{ marginTop: 14 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginTop: 32 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 14 }}>
            <Salto alto={170} />
            <Salto ancho="85%" alto={14} style={{ marginTop: 14 }} />
            <Salto ancho="45%" alto={20} style={{ marginTop: 12 }} />
          </div>
        ))}
      </div>
    </ContenedorCarga>
  );
}
