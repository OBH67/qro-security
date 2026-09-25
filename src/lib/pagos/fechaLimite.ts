/**
 * diseño-pagos-stripe.md §3/§4: la fecha límite de la ficha OXXO/CLABE SPEI
 * siempre se muestra "con día de la semana y hora, nunca solo '2 días'"
 * (ej. "Viernes 26 sep, 23:59"). `Intl`/`toLocaleDateString` en es-MX no da
 * ese formato exacto (agrega comas y puntos distintos según runtime), así
 * que se arma a mano con tablas fijas — determinista en servidor y cliente.
 */
const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "Viernes 26 sep, 23:59" — para el dato destacado de la ficha (§3/§4). */
export function formatearFechaLimite(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${capitalizar(DIAS[d.getDay()])} ${d.getDate()} ${MESES[d.getMonth()]}, ${hh}:${mm}`;
}

/** "viernes 26 sep a las 23:59" — para incrustar en una oración (banner de
 * apartado, §3: "Tus productos quedan apartados hasta el viernes 26 sep a
 * las 23:59."). */
export function formatearFechaLimiteEnFrase(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} a las ${hh}:${mm}`;
}

const SEIS_HORAS_MS = 6 * 60 * 60 * 1000;

/** §3/§4 "Vence en menos de 6 h": el banner de apartado pasa de violeta a
 * ámbar. `ahoraMs` se recibe como parámetro (no `Date.now()` adentro) para
 * que un componente cliente pueda recalcularlo en un intervalo sin que la
 * función deje de ser pura. */
export function venceEnMenosDeSeisHoras(expiresAtIso: string, ahoraMs: number): boolean {
  const restante = new Date(expiresAtIso).getTime() - ahoraMs;
  return restante > 0 && restante < SEIS_HORAS_MS;
}

export function yaVencio(expiresAtIso: string, ahoraMs: number): boolean {
  return new Date(expiresAtIso).getTime() <= ahoraMs;
}

/** arquitectura-pagos-stripe.md §4.1 / diseño-pagos-stripe.md §3 "Pagada
 * tarde (ya liberada)": no hay una bandera propia en `payments` para este
 * caso — se detecta comparando la última vez que se tocó el pago
 * (`updatedAtIso`, que queda en `now()` justo cuando el webhook lo marca
 * `pagado`) contra su fecha límite original. Si el pago se confirmó
 * DESPUÉS de vencer, es que el apartado ya se había liberado cuando llegó
 * el dinero. */
export function seConfirmoDespuesDeVencer(expiresAtIso: string | null, updatedAtIso: string): boolean {
  if (!expiresAtIso) return false;
  return new Date(updatedAtIso).getTime() > new Date(expiresAtIso).getTime();
}
