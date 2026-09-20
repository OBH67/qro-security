import Link from "next/link";
import {
  alternarDisponible,
  alternarMarca,
  quitarFiltro,
  serializarFiltros,
  sinFiltros,
  type FiltrosListado,
} from "@/lib/filtros";
import type { OpcionMarca } from "@/server/db/queries/catalogo";
import { ChipFiltro } from "@/components/molecules/ChipFiltro";

/**
 * index.html:599-649 — panel de filtros de la página de listado (A4).
 * Solo implementa los filtros que sí describe el criterio de aceptación
 * (marca, rango de precio, disponibilidad): las facetas por atributo del
 * demo (resolución/tipo/uso) dependen de PA-17 (`modelo-datos.md` §7),
 * que sigue abierta — no se inventan aquí.
 */
export function PanelFiltros({
  basePath,
  filtros,
  opcionesMarca,
}: {
  basePath: string;
  filtros: FiltrosListado;
  opcionesMarca: OpcionMarca[];
}) {
  const hayFiltrosActivos =
    filtros.marca.length > 0 || filtros.disponible || filtros.precioMin != null || filtros.precioMax != null;

  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <h3
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: 16,
            color: "var(--text-primary)",
          }}
        >
          Disponibilidad
        </h3>
        <Link
          href={`${basePath}${serializarFiltros(alternarDisponible(filtros))}`}
          style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--text-muted)" }}
        >
          <CasillaFiltro activa={filtros.disponible} />
          Solo con existencia
        </Link>
      </div>

      {opcionesMarca.length > 0 && (
        <div>
          <h3
            style={{
              margin: "0 0 12px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 16,
              color: "var(--text-primary)",
            }}
          >
            Marca
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {opcionesMarca.map((opcion) => (
              <Link
                key={opcion.slug}
                href={`${basePath}${serializarFiltros(alternarMarca(filtros, opcion.slug))}`}
                style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--text-muted)" }}
              >
                <CasillaFiltro activa={filtros.marca.includes(opcion.slug)} />
                {opcion.name}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                  {opcion.cantidad}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3
          style={{
            margin: "0 0 12px",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            fontSize: 16,
            color: "var(--text-primary)",
          }}
        >
          Precio
        </h3>
        <form method="GET" action={basePath} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtros.marca.length > 0 && <input type="hidden" name="marca" value={filtros.marca.join(",")} />}
          {filtros.disponible && <input type="hidden" name="disponible" value="1" />}
          {filtros.orden !== "vendidos" && <input type="hidden" name="orden" value={filtros.orden} />}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              name="precio_min"
              min={0}
              placeholder="Mín."
              defaultValue={filtros.precioMin ?? ""}
              aria-label="Precio mínimo"
              style={{
                width: "100%",
                padding: "9px 10px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-input)",
                borderRadius: "var(--radius-input)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            />
            <span style={{ color: "var(--text-muted)" }}>–</span>
            <input
              type="number"
              name="precio_max"
              min={0}
              placeholder="Máx."
              defaultValue={filtros.precioMax ?? ""}
              aria-label="Precio máximo"
              style={{
                width: "100%",
                padding: "9px 10px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-input)",
                borderRadius: "var(--radius-input)",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "9px 14px",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 13.5,
            }}
          >
            Aplicar
          </button>
        </form>
      </div>

      {hayFiltrosActivos && (
        <Link href={`${basePath}${serializarFiltros(sinFiltros(filtros))}`} style={{ fontSize: 13.5, color: "var(--accent)" }}>
          Quitar todos los filtros
        </Link>
      )}
    </aside>
  );
}

function CasillaFiltro({ activa }: { activa: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 16,
        height: 16,
        borderRadius: 3,
        flex: "0 0 auto",
        border: `1px solid ${activa ? "var(--accent)" : "var(--border-input)"}`,
        background: activa ? "var(--accent)" : "transparent",
      }}
    />
  );
}

export function ChipsFiltrosActivos({
  basePath,
  filtros,
  nombresMarca,
}: {
  basePath: string;
  filtros: FiltrosListado;
  nombresMarca: Map<string, string>;
}) {
  const chips: { etiqueta: string; href: string }[] = [];

  for (const slug of filtros.marca) {
    chips.push({
      etiqueta: nombresMarca.get(slug) ?? slug,
      href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "marca", slug))}`,
    });
  }
  if (filtros.disponible) {
    chips.push({
      etiqueta: "Solo con existencia",
      href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "disponible"))}`,
    });
  }
  if (filtros.precioMin != null || filtros.precioMax != null) {
    chips.push({
      etiqueta: `Precio ${filtros.precioMin ?? 0} – ${filtros.precioMax ?? "∞"}`,
      href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "precio"))}`,
    });
  }

  if (chips.length === 0) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
      {chips.map((chip) => (
        <ChipFiltro key={chip.etiqueta} etiqueta={chip.etiqueta} href={chip.href} />
      ))}
    </div>
  );
}
