import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { obtenerSesionActual } from "@/server/auth/sesion";
import { obtenerDireccionesDeCliente, obtenerDatosFiscalesDeCliente } from "@/server/db/queries/cuenta";
import { obtenerCarritoResuelto } from "@/server/db/queries/carrito";
import { obtenerSaldoDisponible } from "@/server/db/queries/saldo";
import { obtenerDiasVigenciaPago } from "@/server/db/queries/pagos";
import { CheckoutForm } from "@/components/organisms/CheckoutForm";

export const metadata: Metadata = { title: "Confirmar pedido — SG Querétaro" };
export const dynamic = "force-dynamic";

/** index.html:1026-1101 (`isCheckout`), C1.1: requiere sesión y dirección
 * completa. Épica P (diseño-pagos-stripe.md §2): + selector de 4 métodos
 * de pago, con Tarjeta/OXXO/SPEI vía Stripe (Payment Element) además del
 * flujo de comprobante existente. */
export default async function PaginaPagar() {
  const sesion = await obtenerSesionActual();
  if (!sesion) redirect("/ingresar?siguiente=/pagar");

  const [direcciones, datosFiscales, carrito, saldoDisponible, oxxoExpiraDias, speiExpiraDias] = await Promise.all([
    obtenerDireccionesDeCliente(sesion.userId),
    obtenerDatosFiscalesDeCliente(sesion.userId),
    obtenerCarritoResuelto(sesion.userId),
    obtenerSaldoDisponible(sesion.userId),
    obtenerDiasVigenciaPago("oxxo_expires_days"),
    obtenerDiasVigenciaPago("spei_expires_days"),
  ]);

  if (carrito.items.length === 0) redirect("/carrito");

  return (
    <section style={{ maxWidth: "var(--content-max-width)", margin: "0 auto", padding: "40px 20px 90px" }}>
      <h1 style={{ margin: "0 0 30px", fontSize: "clamp(28px,3vw,40px)" }}>Confirmar pedido</h1>
      <CheckoutForm
        direcciones={direcciones}
        datosFiscales={datosFiscales}
        carrito={carrito}
        saldoDisponible={saldoDisponible}
        oxxoExpiraDias={oxxoExpiraDias}
        speiExpiraDias={speiExpiraDias}
        clienteNombre={`${sesion.perfil.first_name} ${sesion.perfil.last_name}`.trim()}
        clienteEmail={sesion.email}
      />
    </section>
  );
}
