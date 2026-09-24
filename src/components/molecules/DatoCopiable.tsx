"use client";

import { useRef, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

/** diseño-pagos-stripe.md §9: molécula nueva que extrae el patrón de
 * "etiqueta + valor Mono + botón Copiar + toast" (index.html:1150-1156,
 * `DatosTransferencia.tsx`). La usan la ficha OXXO (§3), los datos SPEI
 * (§4) y, más adelante, el panel admin (§6.2, "ID de pago + copiar").
 *
 * §4 "Error al copiar": si `navigator.clipboard` no está disponible o el
 * navegador niega el permiso, el valor se selecciona automáticamente (en
 * vez de fallar en silencio) y se avisa por toast.
 */
export function DatoCopiable({
  etiqueta,
  valorMostrado,
  valorCopiar,
  nombreAccesibleBoton,
  mensajeToast,
  tamanoValor = 15,
  colorValor = "var(--text-primary)",
  colorEtiqueta = "var(--text-muted)",
  letterSpacing,
  orientacion = "columna",
}: {
  etiqueta: string;
  valorMostrado: string;
  valorCopiar: string;
  nombreAccesibleBoton: string;
  mensajeToast: string;
  tamanoValor?: number | string;
  colorValor?: string;
  colorEtiqueta?: string;
  letterSpacing?: number;
  /** "columna": etiqueta arriba, valor+botón abajo (CLABE, referencia SPEI
   * grande). "fila": etiqueta y valor+botón en la misma línea (filas
   * cortas como banco/beneficiario). */
  orientacion?: "columna" | "fila";
}) {
  const { mostrarToast } = useToast();
  const [copiado, setCopiado] = useState(false);
  const refValor = useRef<HTMLSpanElement>(null);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valorCopiar);
      setCopiado(true);
      mostrarToast(mensajeToast);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Sin permiso/soporte de portapapeles: se selecciona el texto para
      // que la persona lo copie a mano en vez de dejarla sin ninguna señal.
      const seleccion = window.getSelection?.();
      if (seleccion && refValor.current) {
        const rango = document.createRange();
        rango.selectNodeContents(refValor.current);
        seleccion.removeAllRanges();
        seleccion.addRange(rango);
      }
      mostrarToast("Selecciona y copia manualmente");
    }
  }

  const filaValor = (
    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <span ref={refValor} className="font-data" style={{ fontSize: tamanoValor, color: colorValor, letterSpacing }}>
        {valorMostrado}
      </span>
      <button
        type="button"
        onClick={copiar}
        aria-label={nombreAccesibleBoton}
        style={{ padding: "8px 14px", border: "1px solid var(--accent)", color: "var(--accent)", fontSize: 13, flex: "0 0 auto" }}
      >
        {copiado ? "Copiado" : "Copiar"}
      </button>
    </div>
  );

  if (orientacion === "fila") {
    return (
      <div style={{ display: "flex", gap: 16, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, color: colorEtiqueta }}>{etiqueta}</span>
        {filaValor}
      </div>
    );
  }

  return (
    <div>
      <span style={{ display: "block", fontSize: 14, color: colorEtiqueta }}>{etiqueta}</span>
      <div style={{ marginTop: 10 }}>{filaValor}</div>
    </div>
  );
}
