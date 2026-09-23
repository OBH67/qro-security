import { Salto } from "@/components/atoms/Salto";
import { ContenedorCarga } from "@/components/molecules/ContenedorCarga";

/** Misma retícula que `ListadoCatalogo` (filtros 260 px + productos). El
 * colapso móvil de esa página vive en su propio `<style>`, que no existe
 * mientras se muestra esta carga — por eso se repite aquí. */
export default function CargandoCatalogo() {
  return (
    <ContenedorCarga style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "28px 20px 80px" }}>
      <Salto ancho={200} alto={12} style={{ marginBottom: 22 }} />
      <div className="listado-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,260px) minmax(0,1fr)", gap: 32, alignItems: "start" }}>
        <div className="filtros-panel-escritorio" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from({ length: 7 }, (_, i) => (
            <Salto key={i} ancho={i % 3 === 0 ? "60%" : "85%"} alto={i % 3 === 0 ? 16 : 13} />
          ))}
        </div>
        <div>
          <Salto ancho="min(360px, 80%)" alto={34} />
          <Salto ancho={140} alto={13} style={{ marginTop: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20, marginTop: 24 }}>
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 14 }}>
                <Salto alto={170} />
                <Salto ancho="40%" alto={11} style={{ marginTop: 14 }} />
                <Salto ancho="90%" alto={14} style={{ marginTop: 10 }} />
                <Salto ancho="45%" alto={20} style={{ marginTop: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .listado-grid { grid-template-columns: 1fr !important; }
          .filtros-panel-escritorio { display: none !important; }
        }
      `}</style>
    </ContenedorCarga>
  );
}
