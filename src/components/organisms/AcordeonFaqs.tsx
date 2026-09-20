"use client";

import { useState } from "react";
import type { FaqRow } from "@/types/database";

/** index.html:500-513 — acordeón de preguntas frecuentes. */
export function AcordeonFaqs({ preguntas }: { preguntas: FaqRow[] }) {
  const [abierta, setAbierta] = useState<string | null>(null);

  if (preguntas.length === 0) {
    return <p style={{ color: "var(--text-muted)" }}>Todavía no hay preguntas frecuentes publicadas.</p>;
  }

  return (
    <div style={{ maxWidth: 820, borderTop: "1px solid var(--border)" }}>
      {preguntas.map((f) => {
        const abiertaAhora = abierta === f.id;
        return (
          <div key={f.id} style={{ borderBottom: "1px solid var(--border)" }}>
            <button
              type="button"
              onClick={() => setAbierta(abiertaAhora ? null : f.id)}
              aria-expanded={abiertaAhora}
              style={{ display: "flex", gap: 16, alignItems: "center", width: "100%", textAlign: "left", padding: "18px 4px" }}
            >
              <span style={{ flex: 1, fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 18 }}>{f.question}</span>
              <span
                aria-hidden="true"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 20,
                  color: abiertaAhora ? "var(--accent)" : "var(--text-muted)",
                  transform: abiertaAhora ? "rotate(45deg)" : "none",
                }}
              >
                +
              </span>
            </button>
            {abiertaAhora && (
              <p style={{ margin: 0, padding: "0 4px 20px", maxWidth: "68ch", fontSize: 15, lineHeight: 1.6, color: "var(--text-muted)" }}>
                {f.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
