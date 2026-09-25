"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rechazarPagoStripeAction } from "@/server/actions/admin/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";

type Tipo = "monto_distinto" | "pagado_sin_inventario";

/**
 * diseño-pagos-stripe.md §6.3 — banner ámbar arriba de la columna
 * izquierda para los dos casos de revisión especial que sí tienen una
 * señal en base de datos (`payments.needs_review`, arquitectura §4.1/§4.3):
 * SPEI con monto distinto y "pagado sin inventario". El tercer caso del
 * diseño ("no se pudo cancelar en Stripe", arquitectura §4.2) no tiene
 * ninguna bandera propia en el esquema actual — no se implementa aquí
 * para no inventar una detección que el backend no respalda; reportado en
 * el resumen de este incremento.
 */
export function BannerRevisionPago({
  orderId,
  folio,
  tipo,
  montoRecibidoCents,
  montoEsperadoCents,
  correoCliente,
}: {
  orderId: string;
  folio: string;
  tipo: Tipo;
  montoRecibidoCents: number;
  montoEsperadoCents: number;
  correoCliente: string | null;
}) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const montoRecibido = formatearPrecio(montoRecibidoCents / 100);
  const montoEsperado = formatearPrecio(montoEsperadoCents / 100);
  const faltante = formatearPrecio(Math.max(0, montoEsperadoCents - montoRecibidoCents) / 100);

  const mensaje =
    tipo === "monto_distinto"
      ? `El cliente transfirió ${montoRecibido} y el pedido es de ${montoEsperado} — faltan ${faltante}. El dinero quedó en su cuenta de Stripe; decide cómo resolverlo.`
      : `Este pago llegó después de que se liberaron los productos y ya no hay existencias suficientes. Abona el monto como saldo a favor.`;

  const tituloModal = tipo === "monto_distinto" ? `¿Abonar ${montoRecibido} como saldo y cancelar ${folio}?` : `¿Abonar ${montoRecibido} como saldo a favor y cancelar ${folio}?`;

  function confirmar() {
    setError(null);
    startTransition(async () => {
      const motivo = tipo === "monto_distinto" ? "Pago de Stripe con monto distinto al esperado — abonado a saldo y pedido cancelado." : "Pago de Stripe llegado sin inventario disponible — abonado a saldo y pedido cancelado.";
      const resultado = await rechazarPagoStripeAction(orderId, folio, motivo);
      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      setConfirmando(false);
      router.refresh();
    });
  }

  return (
    <div role="alert" style={{ marginBottom: 16, padding: "14px 18px", border: "1px solid var(--warning)", background: "var(--warning-tint)" }}>
      <p style={{ margin: "0 0 12px", fontSize: 14, lineHeight: 1.55, color: "var(--text-primary)" }}>{mensaje}</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {tipo === "monto_distinto" && correoCliente && (
          <a href={`mailto:${correoCliente}?subject=${encodeURIComponent(`Tu pago del pedido ${folio}`)}`} className="btn btn-fantasma btn-sm cut cut-10">
            Contactar al cliente
          </a>
        )}
        <BotonAdmin variante={tipo === "pagado_sin_inventario" ? "primario" : "secundario"} tamano="sm" className="cut cut-10" onClick={() => setConfirmando(true)}>
          {tipo === "monto_distinto" ? `Abonar ${montoRecibido} como saldo y cancelar` : `Abonar ${montoRecibido} como saldo a favor`}
        </BotonAdmin>
      </div>

      {confirmando && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-revision-titulo">
          <div className="modal sg-in">
            <h2 id="modal-revision-titulo" style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 18, margin: "0 0 10px" }}>
              {tituloModal}
            </h2>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 18 }}>
              Ese monto se abona como saldo a favor (nunca se devuelve a su tarjeta ni en efectivo). El pedido se cancela. No se puede deshacer.
            </div>
            {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-fantasma cut cut-10" onClick={() => setConfirmando(false)} disabled={isPending}>
                Cancelar
              </button>
              <BotonAdmin variante="peligro-lleno" className="cut cut-10" onClick={confirmar} cargando={isPending} textoCargando="Procesando…">
                {tipo === "monto_distinto" ? `Abonar ${montoRecibido} y cancelar` : `Abonar ${montoRecibido}`}
              </BotonAdmin>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
