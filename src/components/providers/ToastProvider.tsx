"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

/**
 * index.html:1865-1870 (`sc-if value="{{ toast }}"`) + `Component.say()`
 * (index.html:2010): aviso flotante de 2.6 s, mismo estilo y animación
 * (`sgIn`) que el demo. En el demo vive en el estado del único componente
 * SPA; aquí es un contexto de cliente compartido por todo el sitio porque
 * lo dispara más de un organismo (agregar al carrito, "avísame cuando
 * llegue", el botón de Asesor).
 */

interface ToastContexto {
  mostrarToast: (mensaje: string) => void;
}

const ToastContext = createContext<ToastContexto | null>(null);

const DURACION_MS = 2600;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mensaje, setMensaje] = useState("");
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback((texto: string) => {
    if (temporizador.current) clearTimeout(temporizador.current);
    setMensaje(texto);
    temporizador.current = setTimeout(() => setMensaje(""), DURACION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      {mensaje && (
        <div
          role="status"
          style={{
            position: "fixed",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            zIndex: 90,
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "14px 22px",
            background: "#0F1D2B",
            border: "1px solid #3CE7FF",
            boxShadow: "0 0 22px rgba(60,231,255,.28)",
            animation: "sgIn .2s both",
          }}
        >
          <span style={{ width: 8, height: 8, background: "#3CE7FF" }} />
          <span style={{ fontSize: 14.5, color: "#EAF2F8" }}>{mensaje}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContexto {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
