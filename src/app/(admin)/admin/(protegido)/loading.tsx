import { Salto } from "@/components/atoms/Salto";
import { ContenedorCarga } from "@/components/molecules/ContenedorCarga";

/** diseño.md §11.3 "Cargando (primera vez)": 8 filas de esqueleto de 48 px,
 * chips con forma pero sin contador. El sidebar del layout no se toca. */
export default function CargandoPanel() {
  return (
    <ContenedorCarga>
      <Salto ancho={220} alto={30} style={{ marginBottom: 18 }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {[64, 130, 150, 120, 80, 90, 90].map((ancho, i) => (
          <Salto key={i} ancho={ancho} alto={34} />
        ))}
      </div>
      <div className="tarjeta">
        <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <Salto ancho="60%" alto={11} />
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ height: 48, display: "flex", alignItems: "center", gap: 24, padding: "0 18px", borderBottom: i < 7 ? "1px solid var(--border-subtle)" : "none" }}>
            <Salto ancho={110} alto={13} />
            <Salto ancho={70} alto={11} />
            <Salto ancho="30%" alto={13} />
            <Salto ancho={80} alto={13} style={{ marginLeft: "auto" }} />
            <Salto ancho={120} alto={22} />
          </div>
        ))}
      </div>
    </ContenedorCarga>
  );
}
