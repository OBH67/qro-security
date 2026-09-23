import { Salto } from "@/components/atoms/Salto";
import { ContenedorCarga } from "@/components/molecules/ContenedorCarga";

/** Se pinta dentro del layout de "Mi cuenta": el menú lateral (o las tabs
 * en móvil) se queda fijo y solo el contenido muestra el esqueleto. */
export default function CargandoMiCuenta() {
  return (
    <ContenedorCarga>
      <Salto ancho="min(300px, 70%)" alto={34} />
      <Salto ancho={200} alto={13} style={{ marginTop: 12 }} />
      <div style={{ marginTop: 28, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: 18, borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Salto ancho="40%" alto={14} />
              <Salto ancho="25%" alto={11} style={{ marginTop: 8 }} />
            </div>
            <Salto ancho={90} alto={22} />
          </div>
        ))}
      </div>
    </ContenedorCarga>
  );
}
