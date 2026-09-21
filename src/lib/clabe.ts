/**
 * Validación y formato de CLABE interbancaria — código puro, sin
 * dependencias de infraestructura (arquitectura.md §4, `src/lib/`), para
 * usarse tanto en la validación en vivo del formulario (H4, diseño.md
 * §11.13) como en el servidor antes de guardar.
 */

const PESOS = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];

export interface ResultadoValidacionClabe {
  valida: boolean;
  error: string | null;
}

/** 18 dígitos: 3 banco + 3 plaza + 11 cuenta + 1 dígito verificador
 * (módulo 10 con pesos 3-7-1 repetidos, algoritmo estándar de Banxico). */
export function validarClabe(clabe: string): ResultadoValidacionClabe {
  const limpia = clabe.trim();
  if (!/^\d+$/.test(limpia)) return { valida: false, error: "La CLABE solo debe tener dígitos." };
  if (limpia.length !== 18) return { valida: false, error: `Esa CLABE no es válida: tiene ${limpia.length} dígitos y deben ser 18.` };

  const digitos = limpia.split("").map(Number);
  const suma = digitos.slice(0, 17).reduce((acc, d, i) => acc + ((d * PESOS[i]) % 10), 0);
  const verificadorEsperado = (10 - (suma % 10)) % 10;

  if (digitos[17] !== verificadorEsperado) return { valida: false, error: "Esa CLABE no es válida: el dígito verificador no coincide." };
  return { valida: true, error: null };
}

/** Agrupa una CLABE de 18 dígitos como en `index.html` (`clabeGroups`):
 * banco(3) · plaza(3) · cuenta(11) · verificador(1). */
export function agruparClabe(clabe: string): string {
  const limpia = clabe.trim();
  if (limpia.length !== 18) return limpia;
  return `${limpia.slice(0, 3)} ${limpia.slice(3, 6)} ${limpia.slice(6, 17)} ${limpia.slice(17)}`;
}
