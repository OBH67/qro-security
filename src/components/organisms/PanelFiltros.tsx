"use client";

import { useState } from "react";
import Link from "next/link";
import {
  alternarAtributo,
  alternarCondicion,
  alternarDisponible,
  alternarMarca,
  quitarFiltro,
  serializarFiltros,
  sinFiltros,
  type FiltrosListado,
} from "@/lib/filtros";
import type { OpcionMarca, FacetaAtributo } from "@/server/db/queries/catalogo";
import type { CondicionProducto } from "@/types/database";
import { ChipFiltro } from "@/components/molecules/ChipFiltro";

const PROMOCIONES: { valor: CondicionProducto; label: string }[] = [
  { valor: "nuevo", label: "Producto nuevo" },
  { valor: "caja_abierta", label: "Caja abierta" },
];

/**
 * index.html:599-649 — panel de filtros de la página de listado (A4), y
 * la maqueta de referencia entregada por la dueña (panel con
 * Promociones/Marca/Precio/facetas por atributo). Los filtros por
 * atributo (`facetasAtributo`) vienen de `category_attributes.filterable`
 * (D1) — cierran PA-17 para las categorías que ya tienen atributos
 * declarados; las que no, simplemente no muestran esa sección.
 */
export function PanelFiltros({
  basePath,
  filtros,
  opcionesMarca,
  facetasAtributo,
}: {
  basePath: string;
  filtros: FiltrosListado;
  opcionesMarca: OpcionMarca[];
  facetasAtributo: FacetaAtributo[];
}) {
  const [busquedaMarca, setBusquedaMarca] = useState("");
  const marcasFiltradas = busquedaMarca.trim()
    ? opcionesMarca.filter((m) => m.name.toLowerCase().includes(busquedaMarca.trim().toLowerCase()))
    : opcionesMarca;

  const hayFiltrosActivos =
    filtros.marca.length > 0 ||
    filtros.disponible ||
    filtros.condicion.length > 0 ||
    Object.keys(filtros.atributos).length > 0 ||
    filtros.precioMin != null ||
    filtros.precioMax != null;

  return (
    <aside style={{ display: "flex", flexDirection: "column", gap: 26 }}>
      <div>
        <TituloSeccion>Promociones</TituloSeccion>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {PROMOCIONES.map((p) => (
            <Link
              key={p.valor}
              href={`${basePath}${serializarFiltros(alternarCondicion(filtros, p.valor))}`}
              style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--text-muted)" }}
            >
              <CasillaFiltro activa={filtros.condicion.includes(p.valor)} />
              {p.label}
            </Link>
          ))}
          <Link
            href={`${basePath}${serializarFiltros(alternarDisponible(filtros))}`}
            style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--text-muted)" }}
          >
            <CasillaFiltro activa={filtros.disponible} />
            En existencia
          </Link>
        </div>
      </div>

      {opcionesMarca.length > 0 && (
        <div>
          <TituloSeccion>Marca</TituloSeccion>
          {opcionesMarca.length > 6 && (
            <input
              type="text"
              value={busquedaMarca}
              onChange={(e) => setBusquedaMarca(e.target.value)}
              placeholder="Buscar marca…"
              aria-label="Buscar marca"
              style={{
                width: "100%",
                marginBottom: 10,
                padding: "8px 10px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-input)",
                borderRadius: "var(--radius-input)",
                color: "var(--text-primary)",
                fontSize: 13,
              }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 260, overflowY: "auto" }}>
            {marcasFiltradas.map((opcion) => (
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
            {marcasFiltradas.length === 0 && (
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Sin resultados para &ldquo;{busquedaMarca}&rdquo;.</span>
            )}
          </div>
        </div>
      )}

      <div>
        <TituloSeccion>Precio</TituloSeccion>
        <form method="GET" action={basePath} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtros.marca.length > 0 && <input type="hidden" name="marca" value={filtros.marca.join(",")} />}
          {filtros.disponible && <input type="hidden" name="disponible" value="1" />}
          {filtros.condicion.length > 0 && <input type="hidden" name="condicion" value={filtros.condicion.join(",")} />}
          {Object.entries(filtros.atributos).map(([clave, valores]) => (
            <input key={clave} type="hidden" name={`attr_${clave}`} value={valores.join(",")} />
          ))}
          {filtros.orden !== "vendidos" && <input type="hidden" name="orden" value={filtros.orden} />}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              name="precio_min"
              min={0}
              placeholder="Mín."
              defaultValue={filtros.precioMin ?? ""}
              aria-label="Precio mínimo"
              style={estiloCampoPrecio}
            />
            <span style={{ color: "var(--text-muted)" }}>–</span>
            <input
              type="number"
              name="precio_max"
              min={0}
              placeholder="Máx."
              defaultValue={filtros.precioMax ?? ""}
              aria-label="Precio máximo"
              style={estiloCampoPrecio}
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

      {facetasAtributo.map((faceta) => (
        <div key={faceta.key}>
          <TituloSeccion>{faceta.label}</TituloSeccion>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {faceta.opciones.map((opcion) => (
              <Link
                key={opcion.valor}
                href={`${basePath}${serializarFiltros(alternarAtributo(filtros, faceta.key, opcion.valor))}`}
                style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: "var(--text-muted)" }}
              >
                <CasillaFiltro activa={(filtros.atributos[faceta.key] ?? []).includes(opcion.valor)} />
                {opcion.valor}
                <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12 }}>{opcion.cantidad}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {hayFiltrosActivos && (
        <Link href={`${basePath}${serializarFiltros(sinFiltros(filtros))}`} style={{ fontSize: 13.5, color: "var(--accent)" }}>
          Quitar todos los filtros
        </Link>
      )}
    </aside>
  );
}

const estiloCampoPrecio: React.CSSProperties = {
  width: "100%",
  padding: "9px 10px",
  background: "var(--bg-surface)",
  border: "1px solid var(--border-input)",
  borderRadius: "var(--radius-input)",
  color: "var(--text-primary)",
  fontFamily: "var(--font-mono)",
  fontSize: 13,
};

function TituloSeccion({ children }: { children: React.ReactNode }) {
  return (
    <h3
      style={{
        margin: "0 0 12px",
        fontFamily: "var(--font-display)",
        fontWeight: 500,
        fontSize: 16,
        color: "var(--text-primary)",
      }}
    >
      {children}
    </h3>
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
  etiquetasAtributo,
}: {
  basePath: string;
  filtros: FiltrosListado;
  nombresMarca: Map<string, string>;
  etiquetasAtributo: Map<string, string>;
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
      etiqueta: "En existencia",
      href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "disponible"))}`,
    });
  }
  for (const condicion of filtros.condicion) {
    chips.push({
      etiqueta: PROMOCIONES.find((p) => p.valor === condicion)?.label ?? condicion,
      href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "condicion", condicion))}`,
    });
  }
  if (filtros.precioMin != null || filtros.precioMax != null) {
    chips.push({
      etiqueta: `Precio ${filtros.precioMin ?? 0} – ${filtros.precioMax ?? "∞"}`,
      href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "precio"))}`,
    });
  }
  for (const [clave, valores] of Object.entries(filtros.atributos)) {
    const etiquetaClave = etiquetasAtributo.get(clave) ?? clave;
    for (const valor of valores) {
      chips.push({
        etiqueta: `${etiquetaClave}: ${valor}`,
        href: `${basePath}${serializarFiltros(quitarFiltro(filtros, "atributo", `${clave}:${valor}`))}`,
      });
    }
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
