"use client";

import { useState } from "react";
import type { FaqRow } from "@/types/database";

/** index.html:1723-1745 (`isFaq`) — agrupa las preguntas por `topic`
 * (columna que ya existía en `faqs`, 0006). Las que no tienen `topic`
 * caen en un grupo "General". */
export function FaqsPorTema({ preguntas }: { preguntas: FaqRow[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);

  if (preguntas.length === 0) {
    return <p style={{ color: "#9FB2C3" }}>Todavía no hay preguntas frecuentes publicadas.</p>;
  }

  const grupos = new Map<string, FaqRow[]>();
  for (const f of preguntas) {
    const tema = f.topic ?? "General";
    grupos.set(tema, [...(grupos.get(tema) ?? []), f]);
  }

  return (
    <>
      {[...grupos.entries()].map(([tema, items]) => (
        <div key={tema} style={{ marginBottom: 34 }}>
          <h2 style={{ margin: "0 0 10px", fontFamily: "'Chakra Petch',sans-serif", fontWeight: 600, fontSize: 22, color: "#3CE7FF" }}>{tema}</h2>
          <div style={{ borderTop: "1px solid #1F3244" }}>
            {items.map((f) => {
              const abiertaAhora = abierta === f.id;
              return (
                <div key={f.id} style={{ borderBottom: "1px solid #1F3244" }}>
                  <button
                    type="button"
                    onClick={() => setAbierta(abiertaAhora ? null : f.id)}
                    aria-expanded={abiertaAhora}
                    style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", textAlign: "left", padding: "17px 4px" }}
                  >
                    <span style={{ flex: 1, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 17, color: "#EAF2F8" }}>{f.question}</span>
                    <span
                      aria-hidden="true"
                      style={{
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 20,
                        color: abiertaAhora ? "#3CE7FF" : "#9FB2C3",
                        transform: abiertaAhora ? "rotate(45deg)" : "none",
                        transition: "transform .2s",
                      }}
                    >
                      +
                    </span>
                  </button>
                  {abiertaAhora && (
                    <p style={{ margin: 0, padding: "0 4px 18px", maxWidth: "68ch", fontSize: 15, lineHeight: 1.6, color: "#9FB2C3" }}>{f.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}
