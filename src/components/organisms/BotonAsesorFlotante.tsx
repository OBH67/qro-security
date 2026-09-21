"use client";

import { useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

/**
 * index.html:1860-1863 — botón flotante "Asesor". El demo solo simula la
 * apertura de WhatsApp (`openWa: () => this.say('Abriría WhatsApp con un
 * asesor')`); el número real del administrador es dato de configuración de
 * H4 (todavía no construido, ver `.devsquad/requerimientos.md` PA-5/H4) y
 * el proveedor de WhatsApp sigue abierto en PA-5. Hasta que exista ese
 * dato, este botón reproduce el mismo comportamiento de aviso del demo en
 * vez de inventar un número de WhatsApp o un enlace que no correspondería
 * a nada real — no es una simplificación silenciosa, queda documentado
 * aquí y en `.devsquad/estado.md`.
 */
export function BotonAsesorFlotante() {
  const { mostrarToast } = useToast();
  const [sobre, setSobre] = useState(false);

  return (
    <button
      type="button"
      onClick={() => mostrarToast("Un asesor te contactará por WhatsApp en cuanto esté disponible este canal")}
      onMouseEnter={() => setSobre(true)}
      onMouseLeave={() => setSobre(false)}
      style={{
        position: "fixed",
        right: 22,
        bottom: 22,
        zIndex: 80,
        display: "flex",
        gap: 10,
        alignItems: "center",
        padding: "12px 18px",
        background: "#0F1D2B",
        border: `1px solid ${sobre ? "#45E39A" : "#1F3244"}`,
        color: sobre ? "#45E39A" : "#EAF2F8",
        fontFamily: "'Chakra Petch',sans-serif",
        fontWeight: 500,
        fontSize: 15,
        boxShadow: "0 12px 30px rgba(0,0,0,.5)",
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#45E39A" strokeWidth={1.5} style={{ width: 19, height: 19 }}>
        <path d="M21 12a9 9 0 0 1-13.3 7.9L4 21l1.2-3.6A9 9 0 1 1 21 12z" />
        <path d="M9 10c0 3 2 5 5 5 1 0 1.5-.5 1.5-1.2 0-.5-1.4-1.3-1.8-1.1-.4.2-.6.8-1 .6-.8-.4-1.6-1.2-2-2-.2-.4.4-.6.6-1 .2-.4-.6-1.8-1.1-1.8C9.5 8.5 9 9 9 10z" />
      </svg>
      Asesor
    </button>
  );
}
