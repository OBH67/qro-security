import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerPedidoPorFolio, obtenerDatosBancarios, obtenerPagoStripeDelPedido } from "@/server/db/queries/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { etiquetaEstadoCliente, esMetodoStripe } from "@/lib/pedido";
import { seConfirmoDespuesDeVencer } from "@/lib/pagos/fechaLimite";
import { PasosPedido } from "@/components/molecules/PasosPedido";
import { DatosTransferencia } from "@/components/organisms/DatosTransferencia";
import { FichaPagoOXXO } from "@/components/organisms/pago/FichaPagoOXXO";
import { DatosPagoSPEI } from "@/components/organisms/pago/DatosPagoSPEI";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ folio: string }> }): Promise<Metadata> {
  const { folio } = await params;
  return { title: `Pedido ${folio} — SG Querétaro` };
}

/** index.html:1103-1199 (`isOrder`, justo generado) + 1320-1382
 * (`isDetail`, detalle) — se combinan en una sola pantalla: ambas
 * comparten ~90% del contenido (señal de progreso, datos para transferir,
 * resumen de productos); la diferencia es solo de encabezado. C4: lista con
 * productos, dirección, comprobante subido e historial — el historial
 * (`order_status_history`) no lo lee el cliente por RLS (solo admin), así
 * que se omite del detalle a propósito. */
export default async function PaginaDetallePedido({ params }: { params: Promise<{ folio: string }> }) {
  const { folio } = await params;
  const sesion = await obtenerSesionActual();
  if (!sesion) return null;

  const [pedido, datosBancarios] = await Promise.all([
    obtenerPedidoPorFolio(sesion.userId, folio),
    obtenerDatosBancarios(),
  ]);
  if (!pedido) notFound();

  const pendienteDeComprobante = pedido.status === "pendiente_pago" && pedido.payment_method === "transferencia";
  const cubiertoConSaldo = pedido.payment_method === "saldo_completo";
  const metodoEsStripe = esMetodoStripe(pedido.payment_method);

  // diseño-pagos-stripe.md §5.3: el pago Stripe de este pedido se consulta
  // siempre que el método sea tarjeta/OXXO/SPEI, sin importar el estado
  // actual — la misma fila de `payments` sirve para la ficha mientras está
  // en curso (P3.2/P4.2), para saber si "pagó tarde" una vez ya está en
  // `comprobante_recibido` (arquitectura §4.1) y para saber si su ficha
  // venció mientras seguía en `pendiente_pago` (§5.3, fila "Pago vencido").
  const pago = metodoEsStripe ? await obtenerPagoStripeDelPedido(pedido.id, pedido.payment_method as "tarjeta" | "oxxo" | "spei") : null;
  const montoPedidoCents = Math.round(Number(pedido.total) * 100);

  const fichaVencida = pago?.expiresAt ? new Date(pago.expiresAt).getTime() <= new Date().getTime() : false;
  // arquitectura §4.1: se confirmó DESPUÉS de que la ficha/CLABE/30 min ya
  // habían vencido — el pedido igual llegó a "comprobante_recibido"
  // (re-apartado con éxito), pero el cliente nunca debe leer que perdió su
  // dinero, solo que se está revisando.
  const pagadaTarde = pedido.status === "comprobante_recibido" && metodoEsStripe && pago ? seConfirmoDespuesDeVencer(pago.expiresAt, pago.updatedAt) : false;
  // P4.4: SPEI con monto parcial o de más — Stripe deja el intento en
  // `revision` sin avanzar el pedido (registrar_pago_stripe(), 0029/0030).
  const pagoParcialODeMas = pedido.status === "pago_en_proceso" && pago?.needsReview && pago.amountReceivedCents != null ? pago : null;
  // Ficha/CLABE/30 min vencidos y el pedido ya regresó solo a
  // pendiente_pago (liberar_apartado vía webhook o cron) — no confundir con
  // "pagada tarde" (esa sí llegó a pagarse).
  const pagoVencidoYPendiente = pedido.status === "pendiente_pago" && metodoEsStripe && pago && fichaVencida;

  return (
    <section>
      {/* El bloque móvil no tiene un diseño propio en el mockup (ahí "Ver
          detalle" solo dispara un toast, index.html no modela esta
          pantalla) — se deja el contenido de escritorio tal cual, solo se
          ocultan el link "Volver" y el título "Pedido X" porque ya los da
          el encabezado móvil (`EncabezadoCuentaMovil`: flecha + título). */}
      <Link href="/mi-cuenta/pedidos" className="cuenta-escritorio-solo" style={{ fontSize: 13.5, color: "var(--text-muted)", marginBottom: 18, display: "inline-block" }}>
        Volver a Mis pedidos
      </Link>
      <h1 className="cuenta-escritorio-solo" style={{ margin: 0, fontSize: "clamp(26px,2.8vw,36px)" }}>
        Pedido <span className="font-data" style={{ fontSize: "0.85em" }}>{pedido.folio}</span>
      </h1>
      <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-muted)" }}>
        {new Date(pedido.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
        {etiquetaEstadoCliente(pedido.status, pedido.payment_method)}
      </p>

      <PasosPedido estado={pedido.status} metodo={pedido.payment_method} expiresAt={pago?.expiresAt} />

      {pedido.status === "cancelado" && pedido.cancellation_reason && (
        <p style={{ margin: "0 0 20px", fontSize: 14, color: "var(--text-muted)" }}>Motivo: {pedido.cancellation_reason}</p>
      )}

      {pendienteDeComprobante && (
        <DatosTransferencia
          folio={pedido.folio}
          total={pedido.total}
          datosBancarios={datosBancarios}
          mostrarBotonSubir
          hrefSubir={`/mi-cuenta/pedidos/${pedido.folio}/comprobante`}
        />
      )}

      {pagoVencidoYPendiente && (
        <div style={{ marginTop: 30, padding: "16px 18px", border: "1px solid var(--warning)", background: "var(--warning-tint)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
            {pedido.payment_method === "oxxo" ? "Tu ficha de OXXO venció." : pedido.payment_method === "spei" ? "Tu CLABE para SPEI venció." : "Tu intento de pago con tarjeta venció."}{" "}
            Elige cómo pagar.
          </p>
          <Link href="/pagar" style={{ display: "inline-block", marginTop: 10, fontSize: 13.5, color: "var(--warning)" }}>
            Pagar ahora
          </Link>
        </div>
      )}

      {pedido.status === "pago_en_proceso" && pedido.payment_method === "oxxo" && (
        <FichaPagoOXXO
          folio={pedido.folio}
          montoCents={montoPedidoCents}
          expiresAt={pago?.expiresAt ?? null}
          instrucciones={pago?.instructions?.metodo === "oxxo" ? pago.instructions : null}
          estado={pago?.instructions?.metodo === "oxxo" ? "lista" : "generando"}
          contexto="detalle-pedido"
        />
      )}

      {pedido.status === "pago_en_proceso" && pedido.payment_method === "spei" && (
        <DatosPagoSPEI
          folio={pedido.folio}
          montoCents={montoPedidoCents}
          expiresAt={pago?.expiresAt ?? null}
          instrucciones={pago?.instructions?.metodo === "spei" ? pago.instructions : null}
          estado={pago?.instructions?.metodo === "spei" ? "lista" : "generando"}
          contexto="detalle-pedido"
          pagoParcial={pagoParcialODeMas ? { recibidoCents: pagoParcialODeMas.amountReceivedCents ?? 0, esperadoCents: pagoParcialODeMas.amountCents } : null}
        />
      )}

      {pedido.status === "pago_en_proceso" && pedido.payment_method === "tarjeta" && (
        <div style={{ marginTop: 30, padding: "16px 18px", border: "1px solid var(--processing)", background: "var(--processing-tint)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
            Estamos confirmando tu pago con tu banco. Esto suele tardar unos segundos; puedes cerrar esta página.
          </p>
        </div>
      )}

      {pedido.status === "comprobante_recibido" && metodoEsStripe && (
        <div style={{ marginTop: 30, padding: "16px 18px", border: "1px solid var(--accent)", background: "var(--accent-tint)" }}>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: "var(--text-primary)" }}>
            {pagadaTarde
              ? "Recibimos tu pago después de la fecha límite. Lo estamos revisando y te contactaremos en menos de 24 horas."
              : pedido.payment_method === "tarjeta"
                ? `Recibimos tu pago con tarjeta${pago?.cardLast4 ? ` terminada en ${pago.cardLast4}` : ""}. Lo estamos revisando y te avisaremos cuando tu pedido esté listo para envío.`
                : pedido.payment_method === "oxxo"
                  ? "Recibimos tu pago en OXXO. Lo estamos revisando y te avisaremos cuando tu pedido esté listo para envío."
                  : "Recibimos tu transferencia SPEI. Lo estamos revisando y te avisaremos cuando tu pedido esté listo para envío."}
          </p>
        </div>
      )}

      {cubiertoConSaldo && pedido.status === "comprobante_recibido" && (
        <div style={{ marginTop: 30, padding: 22, border: "1px solid var(--accent)", background: "var(--bg-card)" }}>
          <h2 style={{ margin: 0, fontSize: 19 }}>Cubierto con tu saldo a favor</h2>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--text-muted)" }}>
            Tu saldo cubrió el total de este pedido — no hay nada que transferir. Un asesor confirmará el pago antes
            de pasarlo a Listo para envío.
          </p>
        </div>
      )}

      {pedido.comprobante && (
        <div style={{ marginTop: 30, padding: 22, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 18 }}>Comprobante</h2>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>
            Subido el {new Date(pedido.comprobante.uploaded_at).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
            {pedido.comprobante.status === "validado" ? "Validado" : pedido.comprobante.status === "rechazado" ? "Rechazado" : "En revisión"}
          </p>
          {pedido.comprobante.status === "rechazado" && pedido.comprobante.rejection_reason && (
            <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--danger-text)" }}>Motivo: {pedido.comprobante.rejection_reason}</p>
          )}
        </div>
      )}

      <div style={{ marginTop: 30, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
        {pedido.items.map((it) => (
          <div key={it.id} style={{ display: "flex", gap: 16, alignItems: "center", padding: 18, borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 200, fontSize: 15, color: "var(--text-primary)" }}>{it.name}</span>
            <span className="font-data" style={{ fontSize: 13, color: "var(--text-muted)" }}>×{it.qty}</span>
            <span className="font-data" style={{ fontSize: 14, color: "var(--text-primary)" }}>{formatearPrecio(it.subtotal)}</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: 18 }}>
          <span style={{ fontSize: 17 }}>Total</span>
          <span className="font-data" style={{ fontSize: 26, fontWeight: 600 }}>{formatearPrecio(pedido.total)}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 18, marginTop: 20 }}>
        <div style={{ padding: 20, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Dirección de envío</h3>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--text-muted)" }}>
            {pedido.shipping_address.street} {pedido.shipping_address.ext_number}
            {pedido.shipping_address.int_number ? `, Int. ${pedido.shipping_address.int_number}` : ""}, Col.{" "}
            {pedido.shipping_address.neighborhood}
            <br />
            C.P. {pedido.shipping_address.postal_code}, {pedido.shipping_address.municipality}, {pedido.shipping_address.state}
            <br />
            Recibe {pedido.shipping_address.recipient_name}
          </p>
        </div>
        {pedido.billing_data && (
          <div style={{ padding: 20, border: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: 16 }}>Datos de facturación</h3>
            <p className="font-data" style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: "var(--text-muted)" }}>
              {pedido.billing_data.rfc}
              <br />
              {pedido.billing_data.tax_regime}
              <br />
              {pedido.billing_data.cfdi_use}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
