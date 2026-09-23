"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  validarPagoAction,
  rechazarComprobanteAction,
  cancelarPedidoAction,
  marcarEnviadoAction,
  marcarEntregadoAction,
} from "@/server/actions/admin/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { BotonAdmin } from "@/components/atoms/BotonAdmin";
import type { EstadoPedido } from "@/types/database";

type TipoModal = "validar" | "rechazar" | "cancelar" | "enviar" | "entregar" | null;

/** panel-admin-maqueta.html:1100-1112 (modal genérico) + botones de
 * acción del detalle (líneas 448-452, 501-504) — traducción literal. Un
 * solo componente cliente porque las 5 acciones comparten el mismo
 * patrón de "modal de confirmación → Server Action → refrescar". */
export function AccionesPedido({ orderId, folio, status }: { orderId: string; folio: string; status: EstadoPedido }) {
  const router = useRouter();
  const [modal, setModal] = useState<TipoModal>(null);
  const [motivo, setMotivo] = useState("");
  const [costoEnvio, setCostoEnvio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cerrar() {
    setModal(null);
    setMotivo("");
    setCostoEnvio("");
    setError(null);
  }

  function confirmar() {
    setError(null);
    startTransition(async () => {
      let resultado;
      if (modal === "validar") resultado = await validarPagoAction(orderId, folio);
      else if (modal === "rechazar") resultado = await rechazarComprobanteAction(orderId, folio, motivo);
      else if (modal === "cancelar") resultado = await cancelarPedidoAction(orderId, folio, motivo || undefined);
      else if (modal === "enviar") resultado = await marcarEnviadoAction(orderId, folio, costoEnvio.trim() ? Number(costoEnvio) : null);
      else if (modal === "entregar") resultado = await marcarEntregadoAction(orderId, folio);
      else return;

      if (!resultado.ok) {
        setError(resultado.error);
        return;
      }
      cerrar();
      router.refresh();
    });
  }

  const modalInfo: Record<Exclude<TipoModal, null>, { titulo: string; cuerpo: string; boton: string; claseBtn: string }> = {
    validar: { titulo: `¿Validar el pago del pedido ${folio}?`, cuerpo: "El pedido pasa a Listo para envío. El cliente recibe un correo.", boton: "Sí, validar el pago", claseBtn: "btn-primario" },
    rechazar: { titulo: `¿Rechazar el comprobante de ${folio}?`, cuerpo: "El pedido vuelve a Pendiente de pago, se libera el apartado y el cliente ve el motivo.", boton: "Rechazar comprobante", claseBtn: "btn-peligro-lleno" },
    cancelar: { titulo: "¿Cancelar este pedido?", cuerpo: "No se puede deshacer. Se libera el inventario y, si usó saldo a favor, se le devuelve completo.", boton: "Sí, cancelar el pedido", claseBtn: "btn-peligro-lleno" },
    enviar: { titulo: `¿Marcar ${folio} como enviado?`, cuerpo: "Se descuenta el stock físico y el cliente recibe un correo con el aviso.", boton: "Sí, marcar enviado", claseBtn: "btn-primario" },
    entregar: { titulo: `¿Marcar ${folio} como entregado?`, cuerpo: "Empieza a correr el plazo para que el cliente pueda solicitar una devolución.", boton: "Sí, marcar entregado", claseBtn: "btn-primario" },
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {status === "comprobante_recibido" && (
          <>
            <button className="btn btn-primario cut cut-12" onClick={() => setModal("validar")}>
              Validar pago
            </button>
            <button className="btn btn-peligro cut cut-10" onClick={() => setModal("rechazar")}>
              Rechazar comprobante
            </button>
          </>
        )}
        {status === "listo_envio" && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="campo mono"
              type="number"
              min={0}
              step="0.01"
              placeholder="Costo de envío (opcional)"
              value={costoEnvio}
              onChange={(e) => setCostoEnvio(e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primario cut cut-12" onClick={() => setModal("enviar")}>
              Marcar enviado
            </button>
          </div>
        )}
        {status === "enviado" && (
          <button className="btn btn-primario cut cut-12" onClick={() => setModal("entregar")}>
            Marcar entregado
          </button>
        )}
        {["pendiente_pago", "comprobante_recibido", "listo_envio"].includes(status) && (
          <button className="btn btn-fantasma cut cut-10" onClick={() => setModal("cancelar")}>
            Cancelar pedido
          </button>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
          <div className="modal sg-in">
            <h2 id="modal-titulo" style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 18, margin: "0 0 10px" }}>
              {modal === "enviar" && costoEnvio ? `${modalInfo[modal].titulo} (costo: ${formatearPrecio(Number(costoEnvio) || 0)})` : modalInfo[modal].titulo}
            </h2>
            <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 18 }}>{modalInfo[modal].cuerpo}</div>
            {(modal === "rechazar" || modal === "cancelar") && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 13, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Motivo{modal === "rechazar" ? " *" : " (opcional)"}
                </label>
                <textarea className="campo" style={{ height: 72, paddingTop: 10 }} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="El cliente lo verá" />
              </div>
            )}
            {error && <p style={{ fontSize: 13, color: "var(--danger-text)", marginBottom: 14 }}>{error}</p>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn btn-fantasma cut cut-10" onClick={cerrar} disabled={isPending}>
                Cancelar
              </button>
              <BotonAdmin
                variante={modalInfo[modal].claseBtn.replace(/^btn-/, "") as "primario" | "peligro-lleno"}
                className="cut cut-10"
                onClick={confirmar}
                disabled={modal === "rechazar" && !motivo.trim()}
                cargando={isPending}
                textoCargando="Procesando…"
              >
                {modalInfo[modal].boton}
              </BotonAdmin>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
