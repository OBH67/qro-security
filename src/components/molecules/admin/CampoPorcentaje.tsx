"use client";

/** diseño-pagos-stripe.md §8 (P9, RN-6 modificada): sustituye los radios
 * fijos 100%/70%/Otro del cajón de devoluciones por un control único —
 * campo numérico entero (10-100) + deslizador sincronizado + chips de
 * atajo 100/70/50 (D-P8) — con la misma etiqueta accesible para los tres.
 * Presentacional puro: el estado (texto crudo, para poder mostrar "vacío"
 * o "decimal" antes de convertirlo) y el cálculo del importe viven en
 * `TablaDevolucionesAdmin`, que es quien conoce el precio base y el saldo
 * del cliente. */
export function CampoPorcentaje({
  idCampo,
  idImporte,
  valorTexto,
  onCambiar,
  error,
  disabled,
}: {
  idCampo: string;
  /** id del elemento que muestra el importe calculado (Mono 30px) —
   * referenciado por `aria-describedby` desde el campo y el deslizador. */
  idImporte: string;
  valorTexto: string;
  onCambiar: (texto: string) => void;
  error: string | null;
  disabled?: boolean;
}) {
  const numero = Number(valorTexto);
  const numeroValido = Number.isFinite(numero);
  // El deslizador siempre necesita un entero 10-100 para no romperse aunque
  // el campo tenga, momentáneamente, texto vacío o inválido mientras se
  // escribe (p. ej. "1" antes de terminar de teclear "10").
  const valorDeslizador = numeroValido ? Math.min(100, Math.max(10, Math.round(numero))) : 10;
  const idError = `${idCampo}-error`;
  const describedBy = [idImporte, error ? idError : null].filter(Boolean).join(" ");

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {[100, 70, 50].map((atajo) => (
          <button
            key={atajo}
            type="button"
            className={`chip${numeroValido && numero === atajo ? " activo" : ""}`}
            aria-pressed={numeroValido && numero === atajo}
            onClick={() => onCambiar(String(atajo))}
            disabled={disabled}
          >
            {atajo}%
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <label htmlFor={idCampo} style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Porcentaje
        </label>
        <input
          id={idCampo}
          className="campo mono campo-porcentaje-numero"
          type="number"
          inputMode="numeric"
          min={10}
          max={100}
          step={1}
          value={valorTexto}
          onChange={(e) => onCambiar(e.target.value)}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          disabled={disabled}
          style={{ width: 100, height: 44, fontSize: 16, borderColor: error ? "var(--danger)" : undefined }}
        />
        <span style={{ fontSize: 15, color: "var(--text-muted)" }} aria-hidden="true">
          %
        </span>
      </div>

      <input
        type="range"
        className="deslizador-porcentaje"
        min={10}
        max={100}
        step={1}
        value={valorDeslizador}
        onChange={(e) => onCambiar(e.target.value)}
        aria-label="Porcentaje de saldo a favor (deslizador)"
        aria-describedby={describedBy || undefined}
        disabled={disabled}
        style={{ width: "100%" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-dim)", marginTop: 4, marginBottom: 4 }} aria-hidden="true">
        <span>10%</span>
        <span>100%</span>
      </div>

      {error && (
        <p id={idError} role="alert" style={{ fontSize: 13, color: "var(--danger-text)", marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </>
  );
}
