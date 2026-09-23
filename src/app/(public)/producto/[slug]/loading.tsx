import { Salto } from "@/components/atoms/Salto";
import { ContenedorCarga } from "@/components/molecules/ContenedorCarga";

export default function CargandoProducto() {
  return (
    <ContenedorCarga style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "28px 20px 80px" }}>
      <Salto ancho={260} alto={12} style={{ marginBottom: 22 }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 44, alignItems: "start" }}>
        <div>
          <Salto alto="min(520px, 90vw)" />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <Salto key={i} ancho={72} alto={72} />
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 620 }}>
          <Salto ancho={180} alto={12} />
          <Salto ancho="90%" alto={34} style={{ marginTop: 14 }} />
          <Salto ancho="60%" alto={34} style={{ marginTop: 8 }} />
          <Salto ancho={170} alto={36} style={{ marginTop: 26 }} />
          <Salto ancho="100%" alto={13} style={{ marginTop: 26 }} />
          <Salto ancho="95%" alto={13} style={{ marginTop: 9 }} />
          <Salto ancho="70%" alto={13} style={{ marginTop: 9 }} />
          <Salto ancho="100%" alto={52} style={{ marginTop: 28 }} />
        </div>
      </div>
    </ContenedorCarga>
  );
}
