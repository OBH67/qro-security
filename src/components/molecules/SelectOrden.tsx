"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ETIQUETA_ORDEN, ORDENES_CATALOGO, type OrdenCatalogo } from "@/lib/constantes";

/** index.html:634-640 — el `<select>` de orden. Es el único control del
 * panel de filtros que de verdad necesita JS (un `<select onChange>` no
 * puede autoenviarse sin cliente); el resto (marca, disponibilidad,
 * precio) son enlaces/formularios GET normales. */
export function SelectOrden({ ordenActual }: { ordenActual: OrdenCatalogo }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function alCambiar(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("orden", valor);
    params.set("pagina", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <label htmlFor="orden-catalogo" style={{ fontSize: 13, color: "var(--text-muted)" }}>
        Ordenar por
      </label>
      <select
        id="orden-catalogo"
        value={ordenActual}
        onChange={(e) => alCambiar(e.target.value)}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-input)",
          borderRadius: "var(--radius-input)",
          padding: "9px 12px",
          fontSize: 14,
          color: "var(--text-primary)",
        }}
      >
        {ORDENES_CATALOGO.map((o) => (
          <option key={o} value={o}>
            {ETIQUETA_ORDEN[o]}
          </option>
        ))}
      </select>
    </div>
  );
}
