import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerPedidoPorFolio, obtenerDatosBancarios } from "@/server/db/queries/pedidos";
import { formatearPrecio } from "@/lib/formato";
import { ETIQUETA_ESTADO } from "@/lib/pedido";
import { PasosPedido } from "@/components/molecules/PasosPedido";
import { DatosTransferencia } from "@/components/organisms/DatosTransferencia";

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
        {new Date(pedido.created_at).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" })} · {ETIQUETA_ESTADO[pedido.status]}
      </p>

      <PasosPedido estado={pedido.status} />

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
