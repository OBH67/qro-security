"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const RETRASO_MS = 120;
const LIMITE_MS = 15000;

/** Controla la barra fuera del ciclo de render: los temporizadores viven
 * aquí y solo `setAncho` toca estado de React. */
function crearControlador(setAncho: (ancho: number | null) => void) {
  let activa = false;
  let ancho: number | null = null;
  let retraso: number | undefined;
  let goteo: number | undefined;
  let limite: number | undefined;
  let salida: number | undefined;

  const fijar = (valor: number | null) => {
    ancho = valor;
    setAncho(valor);
  };

  const limpiar = () => {
    window.clearTimeout(retraso);
    window.clearInterval(goteo);
    window.clearTimeout(limite);
    window.clearTimeout(salida);
  };

  const terminar = () => {
    if (!activa) return;
    activa = false;
    limpiar();
    if (ancho === null) return;
    fijar(100);
    salida = window.setTimeout(() => fijar(null), 400);
  };

  const iniciar = () => {
    limpiar();
    activa = true;
    fijar(null);
    retraso = window.setTimeout(() => {
      fijar(12);
      goteo = window.setInterval(() => fijar((ancho ?? 12) + (90 - (ancho ?? 12)) * 0.12), 300);
    }, RETRASO_MS);
    limite = window.setTimeout(terminar, LIMITE_MS);
  };

  return { iniciar, terminar, limpiar };
}

/**
 * Barra de progreso superior durante la navegación entre pantallas
 * (diseño.md §7.1 `BarraProgreso`). El App Router no expone eventos de
 * "inicio de navegación", así que arranca con el clic en un enlace interno y
 * termina cuando cambia la URL. Cubre las esperas que un `loading.tsx` no
 * puede cubrir: layouts que consultan datos al entrar a una sección nueva y
 * la compilación bajo demanda de `next dev`.
 */
export function BarraNavegacion() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [ancho, setAncho] = useState<number | null>(null);
  const [control] = useState(() => crearControlador(setAncho));

  useEffect(() => {
    control.terminar();
  }, [pathname, searchParams, control]);

  useEffect(() => {
    function alClic(e: MouseEvent) {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const enlace = (e.target as Element | null)?.closest?.("a[href]");
      if (!(enlace instanceof HTMLAnchorElement)) return;
      if ((enlace.target && enlace.target !== "_self") || enlace.hasAttribute("download")) return;

      const destino = new URL(enlace.href, window.location.href);
      if (destino.origin !== window.location.origin) return;
      // Las rutas /api/* responden archivos (p. ej. "Exportar CSV"): la URL
      // nunca cambia y la barra se quedaría colgada.
      if (destino.pathname.startsWith("/api/")) return;
      if (destino.pathname === window.location.pathname && destino.search === window.location.search) return;

      control.iniciar();
    }

    // Formularios de filtro (`<form method="get">`, p. ej. el buscador del
    // panel admin): sin `action` a una Server Action, el navegador hace una
    // navegación normal a la misma URL con otra query — no pasa por
    // `router.push`, así que el clic en <a> no lo cubre.
    function alEnviar(e: SubmitEvent) {
      const formulario = e.target;
      if (!(formulario instanceof HTMLFormElement)) return;
      if (formulario.method !== "get" || e.defaultPrevented) return;
      control.iniciar();
    }

    document.addEventListener("click", alClic, true);
    document.addEventListener("submit", alEnviar, true);
    return () => {
      document.removeEventListener("click", alClic, true);
      document.removeEventListener("submit", alEnviar, true);
      control.limpiar();
    };
  }, [control]);

  if (ancho === null) return null;
  return <div className="sg-barra-nav" aria-hidden style={{ width: `${ancho}%`, opacity: ancho >= 100 ? 0 : 1 }} />;
}
