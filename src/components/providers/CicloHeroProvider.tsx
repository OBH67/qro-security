"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * Un solo reloj para el degradado del encabezado (`EncabezadoSitio`) y el
 * carrusel del hero de la portada (`BannerHero`) — antes cada uno tenía su
 * propio `setInterval` + estado local, "sincronizados" solo porque
 * compartían el mismo período (5 s) por convención, no por diseño: en
 * cuanto uno se desmontaba y el otro no (el hero vive solo dentro del
 * árbol de `/`, se desmonta al salir; el encabezado vive en
 * `SitioConChrome`, en la raíz de cada grupo de rutas, y no se desmonta al
 * navegar entre páginas de ese grupo) se desincronizaban — bug real
 * corregido primero con `Date.now()` en cada uno por separado, y ahora
 * con esta única fuente de verdad, más simple de mantener.
 *
 * Este Provider vive junto al encabezado (`SitioConChrome`), así que
 * tampoco se desmonta al navegar dentro de un mismo grupo de rutas: el
 * contador arranca en 0 al cargar el sitio y solo avanza, nunca se
 * reinicia ni se congela mientras el visitante navega.
 *
 * Expone el número de "pasos" de 5 s transcurridos, no un índice ya con
 * el módulo aplicado — cada consumidor tiene su propio arreglo (el
 * encabezado, 3 colores fijos; el hero, los banners reales de la base de
 * datos, de largo variable) y aplica su propio `% largo` sobre el mismo
 * `paso`, así ambos quedan atados al mismo reloj sin que este Provider
 * necesite saber nada de banners ni de colores.
 */
const CICLO_HERO_MS = 5000;

const CicloHeroContext = createContext(0);

export function CicloHeroProvider({ children }: { children: React.ReactNode }) {
  const [paso, setPaso] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPaso((p) => p + 1), CICLO_HERO_MS);
    return () => clearInterval(id);
  }, []);

  return <CicloHeroContext.Provider value={paso}>{children}</CicloHeroContext.Provider>;
}

export function usePasoCicloHero() {
  return useContext(CicloHeroContext);
}
