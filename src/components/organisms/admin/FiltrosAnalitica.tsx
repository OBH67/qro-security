"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GrupoFiltro, SubcategoriaFiltro } from "@/server/db/queries/admin/analitica";

export type PeriodoAnalitica = "7" | "30" | "mes" | "personalizado";

const PERIODOS: { valor: PeriodoAnalitica; label: string }[] = [
  { valor: "7", label: "7 días" },
  { valor: "30", label: "30 días" },
  { valor: "mes", label: "Este mes" },
  { valor: "personalizado", label: "Personalizado" },
];

/** panel-admin-maqueta.html:913-956 / diseño.md §11.12 — barra de
 * filtros. Componente cliente porque el selector de subcategoría depende
 * del grupo elegido (cascada), algo que un `<select>` servido no puede
 * resolver sin JS; la data en sí la sigue trayendo el servidor al
 * navegar (los filtros solo arman la URL). */
export function FiltrosAnalitica({
  grupos,
  subcategorias,
  periodo,
  desde,
  hasta,
  groupId,
  subcategoryId,
  orden,
}: {
  grupos: GrupoFiltro[];
  subcategorias: SubcategoriaFiltro[];
  periodo: PeriodoAnalitica;
  desde: string;
  hasta: string;
  groupId: string;
  subcategoryId: string;
  orden: "unidades" | "importe";
}) {
  const router = useRouter();
  const [desdeLocal, setDesdeLocal] = useState(desde);
  const [hastaLocal, setHastaLocal] = useState(hasta);

  function navegar(params: Record<string, string>) {
    const query = new URLSearchParams({ periodo, desde, hasta, grupo: groupId, subcategoria: subcategoryId, orden, ...params });
    for (const [k, v] of [...query.entries()]) if (!v) query.delete(k);
    router.push(`/admin/analitica?${query.toString()}`);
  }

  const subcategoriasDelGrupo = groupId ? subcategorias.filter((s) => s.groupId === groupId) : subcategorias;

  return (
    <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div style={ETIQUETA_GRUPO}>Periodo</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {PERIODOS.map((p) => (
            <button key={p.valor} className={`chip${periodo === p.valor ? " activo" : ""}`} onClick={() => navegar({ periodo: p.valor })}>
              {p.label}
            </button>
          ))}
        </div>
        {periodo === "personalizado" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 8 }}>
            <input type="date" className="campo mono" style={{ maxWidth: 150 }} value={desdeLocal} onChange={(e) => setDesdeLocal(e.target.value)} />
            <span style={{ color: "var(--text-muted)", fontSize: 13 }}>al</span>
            <input type="date" className="campo mono" style={{ maxWidth: 150 }} value={hastaLocal} onChange={(e) => setHastaLocal(e.target.value)} />
            <button className="btn btn-fantasma btn-sm" onClick={() => navegar({ periodo: "personalizado", desde: desdeLocal, hasta: hastaLocal })}>
              Aplicar
            </button>
          </div>
        )}
      </div>

      <div>
        <div style={ETIQUETA_GRUPO}>Categoría</div>
        <div className="admin-grid-2" style={{ gap: 8, maxWidth: 420 }}>
          <select className="campo" value={groupId} onChange={(e) => navegar({ grupo: e.target.value, subcategoria: "" })}>
            <option value="">Grupo: Todos</option>
            {grupos.map((g) => (
              <option key={g.id} value={g.id}>
                {g.nombre}
              </option>
            ))}
          </select>
          <select className="campo" value={subcategoryId} onChange={(e) => navegar({ subcategoria: e.target.value })}>
            <option value="">Subcategoría: Todas</option>
            {subcategoriasDelGrupo.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div style={ETIQUETA_GRUPO}>Ordenar por</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className={`chip${orden === "unidades" ? " activo" : ""}`} onClick={() => navegar({ orden: "unidades" })}>
            Unidades
          </button>
          <button className={`chip${orden === "importe" ? " activo" : ""}`} onClick={() => navegar({ orden: "importe" })}>
            Importe
          </button>
        </div>
      </div>
    </div>
  );
}

const ETIQUETA_GRUPO: React.CSSProperties = {
  fontSize: 11,
  color: "var(--text-muted)",
  fontFamily: "var(--font-title)",
  fontWeight: 600,
  letterSpacing: 0.6,
  textTransform: "uppercase",
  marginBottom: 6,
};
