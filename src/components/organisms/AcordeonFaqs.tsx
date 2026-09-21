"use client";

import { useState } from "react";
import type { FaqRow } from "@/types/database";

/** index.html:500-513 — acordeón de preguntas frecuentes. */
export function AcordeonFaqs({ preguntas }: { preguntas: FaqRow[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);

  if (preguntas.length === 0) {
    return <p style={{ color: "#9FB2C3" }}>Todavía no hay preguntas frecuentes publicadas.</p>;
  }

  return (
    <div style={{ maxWidth: 820, borderTop: "1px solid #1F3244" }}>
      {preguntas.map((f) => {
        const abiertaAhora = abierta === f.id;
        return (
          <div key={f.id} style={{ borderBottom: "1px solid #1F3244" }}>
            <button
              type="button"
              onClick={() => setAbierta(abiertaAhora ? null : f.id)}
              aria-expanded={abiertaAhora}
              style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", textAlign: "left", padding: "18px 4px" }}
            >
              <span style={{ flex: 1, fontFamily: "'Chakra Petch',sans-serif", fontWeight: 500, fontSize: 18, color: "#EAF2F8" }}>{f.question}</span>
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
              <p style={{ margin: 0, padding: "0 4px 20px", maxWidth: "68ch", fontSize: 15, lineHeight: 1.6, color: "#9FB2C3" }}>
                {f.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
