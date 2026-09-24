"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { formatearPrecio } from "@/lib/formato";
import { generarPedidoAction } from "@/server/actions/pedidos";
import { iniciarPagoStripeAction } from "@/server/actions/pagos";
import { obtenerStripePromise } from "@/lib/stripe/clienteNavegador";
import { aparienciaStripe, fuentesStripe } from "@/lib/stripe/apariencia";
import { Boton } from "@/components/atoms/Boton";
import { SelectorMetodoPago, type MetodoCheckout, type EstadoFormularioTarjeta } from "@/components/organisms/pago/SelectorMetodoPago";
import { FichaPagoOXXO } from "@/components/organisms/pago/FichaPagoOXXO";
import { DatosPagoSPEI } from "@/components/organisms/pago/DatosPagoSPEI";
import { extraerInstruccionesCliente, type NextActionConVoucherOCLABE } from "@/lib/pagos/extraerInstrucciones";
import type { AddressRow, BillingProfileRow, OrderRow, InstruccionesPago } from "@/types/database";
import type { CarritoResuelto } from "@/server/actions/carrito";

/** index.html:1026-1101 (`isCheckout`) — traducción literal para la
 * dirección/facturación/resumen, que no cambian. diseño-pagos-stripe.md §2:
 * el bloque de "Método de pago" de una sola opción se reemplaza por el
 * selector de 4 (Tarjeta preseleccionada + OXXO + SPEI vía Stripe +
 * Transferencia con comprobante, que conserva EXACTAMENTE su flujo
 * anterior, P1.2). El bloque de saldo a favor del demo (index.html:1069-
 * 1074) sigue igual salvo el caso "cubre el 100%" (§2.5), que ahora
 * reemplaza el selector por el banner verde. */
export function CheckoutForm({
  direcciones,
  datosFiscales,
  carrito,
  saldoDisponible,
  oxxoExpiraDias,
  speiExpiraDias,
  clienteNombre,
  clienteEmail,
}: {
  direcciones: AddressRow[];
  datosFiscales: BillingProfileRow[];
  carrito: CarritoResuelto;
  saldoDisponible: number;
  oxxoExpiraDias: number;
  speiExpiraDias: number;
  clienteNombre: string;
  clienteEmail: string;
}) {
  // Elements se monta UNA vez para todo el checkout (arquitectura-pagos-
  // stripe.md §1: Payment Element embebido, nunca redirect externo) — solo
  // la opción "Tarjeta" llega a mostrar de verdad el `<PaymentElement>`
  // (SelectorMetodoPago.tsx), pero el botón "Pagar" del aside necesita
  // `useStripe()`/`useElements()` sin importar dónde esté en el árbol, así
  // que envuelve todo el formulario. `mode:'payment'` (Intent diferido,
  // docs.stripe.com/payments/accept-a-payment-deferred): el formulario de
  // tarjeta se puede dibujar de inmediato sin esperar a que exista un
  // pedido — el PaymentIntent real (y el apartado de inventario, RN-13) se
  // crea hasta que el cliente pulsa "Pagar" (§2.6 "al pulsar el botón").
  const totalCentavosInicial = Math.max(1, Math.round(carrito.subtotal * 100));

  return (
    <Elements
      stripe={obtenerStripePromise()}
      options={{
        mode: "payment",
        amount: totalCentavosInicial,
        currency: "mxn",
        paymentMethodTypes: ["card"],
        appearance: aparienciaStripe,
        fonts: fuentesStripe,
        loader: "never",
      }}
    >
      <ContenidoCheckout
        direcciones={direcciones}
        datosFiscales={datosFiscales}
        carrito={carrito}
        saldoDisponible={saldoDisponible}
        oxxoExpiraDias={oxxoExpiraDias}
        speiExpiraDias={speiExpiraDias}
        clienteNombre={clienteNombre}
        clienteEmail={clienteEmail}
      />
    </Elements>
  );
}

type EstadoEnvio = "idle" | "apartando" | "procesando";
type TipoErrorGeneral = "sin_inventario" | "servidor" | null;

function ContenidoCheckout({
  direcciones,
  datosFiscales,
  carrito,
  saldoDisponible,
  oxxoExpiraDias,
  speiExpiraDias,
  clienteNombre,
  clienteEmail,
}: {
  direcciones: AddressRow[];
  datosFiscales: BillingProfileRow[];
  carrito: CarritoResuelto;
  saldoDisponible: number;
  oxxoExpiraDias: number;
  speiExpiraDias: number;
  clienteNombre: string;
  clienteEmail: string;
}) {
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();

  const [addressId, setAddressId] = useState(direcciones.find((a) => a.is_default)?.id ?? direcciones[0]?.id ?? "");
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [billingProfileId, setBillingProfileId] = useState(datosFiscales.find((b) => b.is_default)?.id ?? datosFiscales[0]?.id ?? "");
  const [agree, setAgree] = useState(false);
  const [usarSaldo, setUsarSaldo] = useState(false);
  const [metodo, setMetodo] = useState<MetodoCheckout>("tarjeta");

  const [estadoEnvio, setEstadoEnvio] = useState<EstadoEnvio>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tipoErrorGeneral, setTipoErrorGeneral] = useState<TipoErrorGeneral>(null);
  const [errorTarjeta, setErrorTarjeta] = useState<string | null>(null);
  const [estadoFormularioTarjeta, setEstadoFormularioTarjeta] = useState<EstadoFormularioTarjeta>("cargando");
  const [pantallaExito, setPantallaExito] = useState<{ folio: string; total: number } | null>(null);

  /** P3.2/P4.2: pantalla "ficha de pago"/"datos para transferir" que
   * reemplaza al checkout una vez que `confirmOxxoPayment()` /
   * `confirmCustomerBalancePayment()` regresan (éxito o error) —
   * diseño-pagos-stripe.md §3/§4. `instrucciones` viene tipado por método
   * (nunca se mezclan OXXO y SPEI en el mismo estado). */
  const [pantallaFicha, setPantallaFicha] = useState<
    | { metodo: "oxxo"; estado: "lista" | "error_generar"; folio: string; montoCents: number; expiresAt: string | null; instrucciones: Extract<InstruccionesPago, { metodo: "oxxo" }> | null; mensajeError: string | null }
    | { metodo: "spei"; estado: "lista" | "error_generar"; folio: string; montoCents: number; expiresAt: string | null; instrucciones: Extract<InstruccionesPago, { metodo: "spei" }> | null; mensajeError: string | null }
    | null
  >(null);

  // §11 "Errores de pago: banner con role=alert y foco programático; nunca
  // solo borde rojo" — mueve el foco de teclado al banner en cuanto
  // aparece, para que un lector de pantalla lo anuncie de inmediato.
  const refErrorGeneral = useRef<HTMLDivElement>(null);
  const refErrorTarjeta = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (tipoErrorGeneral) refErrorGeneral.current?.focus();
  }, [tipoErrorGeneral]);
  useEffect(() => {
    if (errorTarjeta) refErrorTarjeta.current?.focus();
  }, [errorTarjeta]);

  // D3.2: nunca más que el subtotal ni más de lo disponible — el servidor
  // lo vuelve a acotar de cualquier forma (crear_pedido()/aplicar_saldo()),
  // esto solo evita mostrar un total negativo mientras se escribe.
  const creditToApply = usarSaldo ? Math.min(saldoDisponible, carrito.subtotal) : 0;
  const totalConSaldo = Math.max(0, carrito.subtotal - creditToApply);
  const totalCentavos = Math.round(totalConSaldo * 100);
  const saldoCubreTodo = totalConSaldo === 0;

  // Llave de idempotencia (0011): UNA por montaje del componente. Se
  // reutiliza en CADA intento de pago mientras el cliente siga en esta
  // pantalla (reintentar tras una tarjeta rechazada, cambiar de método): un
  // reintento con la misma llave regresa el MISMO pedido y el MISMO
  // intento de Stripe en vez de duplicarlos (crear_pedido()/
  // iniciar_pago_stripe(), ambos idempotentes por esta llave).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  // Mantiene el PaymentIntent diferido en sincronía con el total real
  // (cambia si se aplica/quita saldo a favor, P1.3) sin volver a montar el
  // Payment Element — `elements.update()` es la forma oficial de Stripe
  // para esto en modo diferido.
  useEffect(() => {
    if (!elements || totalCentavos <= 0) return;
    elements.update({ amount: totalCentavos });
  }, [elements, totalCentavos]);

  const deshabilitadoPorEnvio = estadoEnvio !== "idle";

  async function crearOReutilizarPedido(): Promise<OrderRow> {
    const resultado = await generarPedidoAction({
      addressId,
      wantsInvoice,
      billingProfileId: wantsInvoice ? billingProfileId : undefined,
      agree: true,
      idempotencyKey,
      creditToApply,
    });
    if (!resultado.ok) throw new Error(resultado.error);
    return resultado.data;
  }

  function manejarErrorApartado(mensaje: string) {
    setEstadoEnvio("idle");
    if (mensaje.includes("Ya no hay piezas suficientes")) {
      setTipoErrorGeneral("sin_inventario");
      setError(mensaje);
    } else {
      setTipoErrorGeneral("servidor");
      // §2.6: "Decir que no hubo cargo es obligatorio en todo error de pago."
      setError("No pudimos iniciar tu pago. No se hizo ningún cargo. Inténtalo de nuevo en un momento.");
    }
  }

  /** Flujo sin cambios (P1.2): comprobante o el caso "saldo cubre el
   * 100%" (D3.3) — ambos ya pasaban por `generarPedidoAction` antes de
   * este incremento. */
  async function generarPedidoSimple() {
    setError(null);
    setTipoErrorGeneral(null);
    if (!addressId) {
      setError("Elige una dirección de envío.");
      return;
    }
    if (wantsInvoice && !billingProfileId) {
      setError("Elige o captura tus datos fiscales para pedir factura.");
      return;
    }
    setEstadoEnvio("apartando");
    try {
      const pedido = await crearOReutilizarPedido();
      router.push(`/mi-cuenta/pedidos/${pedido.folio}`);
    } catch (e) {
      manejarErrorApartado(e instanceof Error ? e.message : "Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  const MENSAJE_ERROR_OXXO = "No pudimos generar tu ficha de OXXO. No se apartaron tus productos ni se hizo ningún cargo.";
  const MENSAJE_ERROR_SPEI = "No pudimos generar tus datos de transferencia. No se apartaron tus productos.";

  /** P3.1: confirma el PaymentIntent de OXXO ya creado. Sin Payment Element
   * montado para este método (ver nota en `pagarConStripe`), así que se usa
   * el confirm específico de Stripe en vez de `confirmPayment({elements})`.
   * Nunca deja pasar una excepción hacia `pagarConStripe` — el apartado ya
   * se hizo; de aquí en adelante un error es "no pudimos generar la
   * ficha", no "no pudimos apartar tu pedido". */
  async function confirmarOxxo(folio: string, clientSecret: string, expiresAt: string, montoCents: number) {
    try {
      const resultado = await stripe!.confirmOxxoPayment(clientSecret, {
        payment_method: { billing_details: { name: clienteNombre, email: clienteEmail } },
      });
      if (resultado.error) throw new Error(resultado.error.message ?? MENSAJE_ERROR_OXXO);

      const instrucciones = extraerInstruccionesCliente(resultado.paymentIntent?.next_action as unknown as NextActionConVoucherOCLABE | null | undefined);
      if (!instrucciones || instrucciones.metodo !== "oxxo") {
        setPantallaFicha({ metodo: "oxxo", estado: "error_generar", folio, montoCents, expiresAt: null, instrucciones: null, mensajeError: MENSAJE_ERROR_OXXO });
        return;
      }
      setPantallaFicha({ metodo: "oxxo", estado: "lista", folio, montoCents, expiresAt, instrucciones, mensajeError: null });
    } catch (e) {
      setPantallaFicha({ metodo: "oxxo", estado: "error_generar", folio, montoCents, expiresAt: null, instrucciones: null, mensajeError: e instanceof Error ? e.message : MENSAJE_ERROR_OXXO });
    }
  }

  /** P4.1: análogo a `confirmarOxxo()` para SPEI (`customer_balance` +
   * `mx_bank_transfer`, arquitectura §2/§6). `handleActions: false` es
   * obligatorio para este método (Stripe no maneja el siguiente paso por
   * nosotros, arquitectura §1: nunca redirige fuera del sitio). */
  async function confirmarSpei(folio: string, clientSecret: string, expiresAt: string, montoCents: number) {
    try {
      const resultado = await stripe!.confirmCustomerBalancePayment(
        clientSecret,
        {
          payment_method: { customer_balance: {} },
          payment_method_options: { customer_balance: { funding_type: "bank_transfer", bank_transfer: { type: "mx_bank_transfer" } } },
        },
        { handleActions: false },
      );
      if (resultado.error) throw new Error(resultado.error.message ?? MENSAJE_ERROR_SPEI);

      const instrucciones = extraerInstruccionesCliente(resultado.paymentIntent?.next_action as unknown as NextActionConVoucherOCLABE | null | undefined);
      if (!instrucciones || instrucciones.metodo !== "spei") {
        setPantallaFicha({ metodo: "spei", estado: "error_generar", folio, montoCents, expiresAt: null, instrucciones: null, mensajeError: MENSAJE_ERROR_SPEI });
        return;
      }
      setPantallaFicha({ metodo: "spei", estado: "lista", folio, montoCents, expiresAt, instrucciones, mensajeError: null });
    } catch (e) {
      setPantallaFicha({ metodo: "spei", estado: "error_generar", folio, montoCents, expiresAt: null, instrucciones: null, mensajeError: e instanceof Error ? e.message : MENSAJE_ERROR_SPEI });
    }
  }

  /** P2-P4: tarjeta/OXXO/SPEI — crea el pedido, arranca el intento de pago
   * (aparta inventario + PaymentIntent, RN-13) y, solo para tarjeta,
   * confirma con Stripe sin salir del sitio (arquitectura §1). */
  async function pagarConStripe() {
    setError(null);
    setTipoErrorGeneral(null);
    setErrorTarjeta(null);
    if (!addressId) {
      setError("Elige una dirección de envío.");
      return;
    }
    if (wantsInvoice && !billingProfileId) {
      setError("Elige o captura tus datos fiscales para pedir factura.");
      return;
    }

    if (metodo === "tarjeta") {
      if (!stripe || !elements) {
        setEstadoFormularioTarjeta("error_carga");
        return;
      }
      const { error: errorSubmit } = await elements.submit();
      if (errorSubmit) {
        setErrorTarjeta(errorSubmit.message ?? "Revisa los datos de tu tarjeta.");
        return;
      }
    }

    setEstadoEnvio("apartando");
    try {
      const pedido = await crearOReutilizarPedido();

      const inicio = await iniciarPagoStripeAction({ orderId: pedido.id, metodo, idempotencyKey });
      if (!inicio.ok) {
        manejarErrorApartado(inicio.error);
        return;
      }
      if (inicio.data.tipo !== "payment_element") {
        manejarErrorApartado("No pudimos iniciar tu pago. No se hizo ningún cargo. Inténtalo de nuevo en un momento.");
        return;
      }

      if (metodo === "oxxo" || metodo === "spei") {
        // OXXO/SPEI: el PaymentIntent ya existe y el inventario ya está
        // apartado (RN-13). No hay Payment Element montado para estos dos
        // métodos (§2.2: "OXXO y SPEI expanden una nota de dos líneas", sin
        // formulario) — por eso NO se usa `stripe.confirmPayment({ elements
        // })` como con tarjeta (ese `elements` está fijo a
        // `paymentMethodTypes:["card"]`, arquitectura §1, y no coincide con
        // el PaymentIntent real de oxxo/customer_balance). Se usa en su
        // lugar el confirm específico de cada método
        // (`confirmOxxoPayment`/`confirmCustomerBalancePayment`), el patrón
        // oficial de Stripe para pagar sin Payment Element. El resultado
        // trae `next_action.oxxo_display_details` /
        // `.display_bank_transfer_instructions` — la misma extracción que
        // hace el webhook (`extraerInstrucciones()`), repetida aquí para el
        // navegador en `extraerInstruccionesCliente()`.
        setEstadoEnvio("procesando");
        if (metodo === "oxxo") {
          await confirmarOxxo(pedido.folio, inicio.data.clientSecret, inicio.data.expiresAt, totalCentavos);
        } else {
          await confirmarSpei(pedido.folio, inicio.data.clientSecret, inicio.data.expiresAt, totalCentavos);
        }
        setEstadoEnvio("idle");
        return;
      }

      setEstadoEnvio("procesando");
      const confirmacion = await stripe!.confirmPayment({
        elements: elements!,
        clientSecret: inicio.data.clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/mi-cuenta/pedidos/${pedido.folio}`,
          payment_method_data: { billing_details: { name: clienteNombre, email: clienteEmail } },
        },
        redirect: "if_required",
      });

      if (confirmacion.error) {
        setEstadoEnvio("idle");
        // §2.6 "Tarjeta rechazada": Stripe ya trae el mensaje traducido al
        // español; el apartado (30 min) sigue vigente para reintentar.
        setErrorTarjeta(
          confirmacion.error.message
            ? `Tu banco rechazó el pago. No se hizo ningún cargo. Revisa los datos o prueba con otra tarjeta u otro método. ${confirmacion.error.message}`
            : "Tu banco rechazó el pago. No se hizo ningún cargo. Revisa los datos o prueba con otra tarjeta u otro método.",
        );
        return;
      }

      // Éxito (P2.5): el estado real del pedido lo decide el webhook, no
      // el navegador (RN-12) — nunca se dice "pedido confirmado" aquí.
      setPantallaExito({ folio: pedido.folio, total: totalConSaldo });
    } catch (e) {
      manejarErrorApartado(e instanceof Error ? e.message : "Ocurrió un error inesperado. Intenta de nuevo.");
    }
  }

  const etiquetaBoton = useMemo(() => {
    if (saldoCubreTodo) return "Confirmar pedido";
    switch (metodo) {
      case "tarjeta":
        return `Pagar ${formatearPrecio(totalConSaldo)}`;
      case "oxxo":
        return "Generar ficha de pago OXXO";
      case "spei":
        return "Ver datos para transferir";
      case "comprobante":
      default:
        return "Generar pedido";
    }
  }, [metodo, saldoCubreTodo, totalConSaldo]);

  const textoAcuerdo = useMemo(() => {
    if (saldoCubreTodo) return "Entiendo que mi pedido queda esperando la confirmación de un asesor antes de avanzar.";
    switch (metodo) {
      case "tarjeta":
        return "Entiendo que mi pedido se revisa antes de enviarse.";
      case "oxxo":
        return `Entiendo que tengo ${oxxoExpiraDias} ${oxxoExpiraDias === 1 ? "día" : "días"} para pagar en OXXO o mi pedido se libera.`;
      case "spei":
        return `Entiendo que tengo ${speiExpiraDias} ${speiExpiraDias === 1 ? "día" : "días"} para transferir o mi pedido se libera.`;
      case "comprobante":
      default:
        return "Entiendo que mi pedido se confirma al subir mi comprobante de pago.";
    }
  }, [metodo, oxxoExpiraDias, saldoCubreTodo, speiExpiraDias]);

  const textoCargando = estadoEnvio === "apartando" ? "Apartando tus productos…" : estadoEnvio === "procesando" ? "Procesando pago…" : undefined;

  // `OpcionMetodoPago` desmonta su contenido expandido cuando deja de
  // estar seleccionada (§2.2 "solo la opción seleccionada se expande") —
  // el `<PaymentElement>` de tarjeta se desmonta al cambiar a otro método,
  // así que si el cliente regresa a "Tarjeta" vuelve a montarse desde
  // cero: hay que volver a mostrar el esqueleto de carga en vez de asumir
  // que ya estaba listo.
  function cambiarMetodo(nuevo: MetodoCheckout) {
    setErrorTarjeta(null);
    if (nuevo !== "tarjeta") setEstadoFormularioTarjeta("cargando");
    setMetodo(nuevo);
  }

  function alPulsarBoton() {
    if (saldoCubreTodo || metodo === "comprobante") {
      void generarPedidoSimple();
    } else {
      void pagarConStripe();
    }
  }

  if (pantallaExito) {
    return <PantallaExitoTarjeta folio={pantallaExito.folio} total={pantallaExito.total} />;
  }

  if (pantallaFicha?.metodo === "oxxo") {
    return (
      <FichaPagoOXXO
        folio={pantallaFicha.folio}
        montoCents={pantallaFicha.montoCents}
        expiresAt={pantallaFicha.expiresAt}
        instrucciones={pantallaFicha.instrucciones}
        estado={pantallaFicha.estado}
        mensajeError={pantallaFicha.mensajeError}
        onReintentar={() => {
          setPantallaFicha(null);
          void pagarConStripe();
        }}
        contexto="post-pago"
      />
    );
  }

  if (pantallaFicha?.metodo === "spei") {
    return (
      <DatosPagoSPEI
        folio={pantallaFicha.folio}
        montoCents={pantallaFicha.montoCents}
        expiresAt={pantallaFicha.expiresAt}
        instrucciones={pantallaFicha.instrucciones}
        estado={pantallaFicha.estado}
        mensajeError={pantallaFicha.mensajeError}
        onReintentar={() => {
          setPantallaFicha(null);
          void pagarConStripe();
        }}
        contexto="post-pago"
      />
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 360px", gap: 32, alignItems: "start" }} className="pagar-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>Dirección de envío</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {direcciones.length === 0 && (
              <p style={{ margin: 0, fontSize: 14.5, color: "var(--text-muted)" }}>
                Todavía no tienes una dirección guardada.{" "}
                <a href="/mi-cuenta/direcciones" style={{ color: "var(--accent)" }}>Agrega una en Mi cuenta</a> antes de continuar.
              </p>
            )}
            {direcciones.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAddressId(a.id)}
                style={{ display: "flex", gap: 14, alignItems: "flex-start", width: "100%", textAlign: "left", padding: 18, background: "var(--bg-card)", border: `1px solid ${addressId === a.id ? "var(--accent)" : "var(--border)"}` }}
              >
                <span style={{ width: 16, height: 16, borderRadius: "50%", flex: "0 0 auto", marginTop: 3, border: `1px solid ${addressId === a.id ? "var(--accent)" : "var(--border-subtle)"}`, background: addressId === a.id ? "var(--accent)" : "transparent" }} />
                <span>
                  <span style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>{a.label}</span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 14, lineHeight: 1.55, color: "var(--text-muted)" }}>
                    {a.street} {a.ext_number}{a.int_number ? `, Int. ${a.int_number}` : ""}, Col. {a.neighborhood}, C.P. {a.postal_code}, {a.municipality}, {a.state} · Recibe {a.recipient_name}
                  </span>
                </span>
              </button>
            ))}
            <a href="/mi-cuenta/direcciones" style={{ alignSelf: "flex-start", fontSize: 14, color: "var(--accent)", padding: "6px 0" }}>Agregar dirección nueva</a>
          </div>
        </div>

        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>Facturación</h2>
          <button
            type="button"
            onClick={() => setWantsInvoice((v) => !v)}
            style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", textAlign: "left", padding: 18, border: "1px solid var(--border)", background: "var(--bg-card)" }}
          >
            <span style={{ position: "relative", width: 46, height: 26, flex: "0 0 auto", borderRadius: 13, border: `1px solid ${wantsInvoice ? "var(--accent)" : "var(--border-subtle)"}`, background: wantsInvoice ? "var(--bg-hover)" : "var(--bg-surface)" }}>
              <span style={{ position: "absolute", top: 3, left: wantsInvoice ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: wantsInvoice ? "var(--accent)" : "var(--text-disabled)" }} />
            </span>
            <span>
              <span style={{ display: "block", fontSize: 16, color: "var(--text-primary)" }}>Quiero factura</span>
              <span className="font-data" style={{ display: "block", marginTop: 3, fontSize: 12.5, color: "var(--text-muted)" }}>
                {datosFiscales[0] ? `RFC ${datosFiscales[0].rfc} · ${datosFiscales[0].tax_regime}` : "Captura tus datos fiscales en Mi cuenta"}
              </span>
            </span>
          </button>
          {wantsInvoice && datosFiscales.length === 0 && (
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--warning)" }}>
              Necesitas capturar tus datos fiscales antes de continuar.{" "}
              <a href="/mi-cuenta/datos-fiscales" style={{ color: "var(--accent)" }}>Agrégalos aquí</a>.
            </p>
          )}
          {wantsInvoice && datosFiscales.length > 1 && (
            <div style={{ marginTop: 10 }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>Usar estos datos fiscales</label>
              <select
                value={billingProfileId}
                onChange={(e) => setBillingProfileId(e.target.value)}
                style={{ width: "100%", maxWidth: 360, padding: "11px 14px", background: "var(--bg-surface)", border: "1px solid var(--border-input)", borderRadius: "var(--radius-input)", color: "var(--text-primary)", fontSize: 15 }}
              >
                {datosFiscales.map((f) => (
                  <option key={f.id} value={f.id}>{f.rfc} · {f.legal_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <h2 style={{ margin: "0 0 14px", fontSize: 20 }}>¿Cómo quieres pagar?</h2>

          {tipoErrorGeneral && error && (
            <div ref={refErrorGeneral} role="alert" tabIndex={-1} style={{ marginBottom: 14, padding: "14px 16px", border: "1px solid var(--danger)", background: "var(--danger-tint)", outline: "none" }}>
              {tipoErrorGeneral === "sin_inventario" ? (
                <>
                  <p style={{ margin: "0 0 10px", fontSize: 14, color: "var(--danger-text)" }}>
                    Alguien acaba de comprar la última pieza de uno de tus productos. No se hizo ningún cargo.
                  </p>
                  <a href="/carrito" style={{ display: "inline-block", padding: "8px 14px", border: "1px solid var(--danger-text)", color: "var(--danger-text)", fontSize: 13.5 }}>
                    Volver al carrito
                  </a>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: 14, color: "var(--danger-text)" }}>{error}</p>
              )}
            </div>
          )}

          {saldoCubreTodo ? (
            <div style={{ padding: 18, border: "1px solid var(--success)", background: "var(--success-tint)" }}>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: "var(--text-primary)" }}>
                Tu saldo a favor cubre todo este pedido. No tienes que pagar nada; lo confirmamos en cuanto lo revisemos.
              </p>
            </div>
          ) : (
            <SelectorMetodoPago
              metodo={metodo}
              onCambiarMetodo={cambiarMetodo}
              deshabilitado={deshabilitadoPorEnvio}
              oxxoExpiraDias={oxxoExpiraDias}
              speiExpiraDias={speiExpiraDias}
              estadoFormularioTarjeta={estadoFormularioTarjeta}
              errorTarjeta={errorTarjeta}
              onReintentarCargaTarjeta={() => setEstadoFormularioTarjeta("cargando")}
              onCambioPaymentElement={(listo) => setEstadoFormularioTarjeta(listo ? "listo" : "cargando")}
              onErrorCargaPaymentElement={() => setEstadoFormularioTarjeta("error_carga")}
              refErrorTarjeta={refErrorTarjeta}
            />
          )}
        </div>

        {saldoDisponible > 0 && !saldoCubreTodo && (
          <div style={{ padding: 18, border: "1px solid var(--warning)", background: "var(--warning-tint)", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ flex: 1, minWidth: 220, fontSize: 15, color: "var(--text-primary)" }}>
              {usarSaldo ? `Saldo aplicado: −${formatearPrecio(creditToApply)}` : `Tienes ${formatearPrecio(saldoDisponible)} de saldo a favor por devoluciones`}
            </span>
            <button
              type="button"
              onClick={() => setUsarSaldo((v) => !v)}
              disabled={deshabilitadoPorEnvio}
              style={{ padding: "10px 18px", border: "1px solid var(--warning)", color: "var(--warning)", fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 14 }}
            >
              {usarSaldo ? "Quitar saldo" : "Aplicar a este pedido"}
            </button>
          </div>
        )}
      </div>

      <aside style={{ border: "1px solid var(--border)", background: "var(--bg-card)", padding: 24, position: "sticky", top: 96 }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>Tu pedido</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          {carrito.items.map((it) => (
            <div key={it.productId} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span className="font-data" style={{ fontSize: 12, color: "var(--accent)", minWidth: 24 }}>×{it.qty}</span>
              <span style={{ flex: 1, fontSize: 14, lineHeight: 1.4, color: "var(--text-primary)" }}>{it.name}</span>
              <span className="font-data" style={{ fontSize: 13, color: "var(--text-muted)" }}>{formatearPrecio(it.price * it.qty)}</span>
            </div>
          ))}
        </div>
        {creditToApply > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontSize: 14, color: "var(--success)" }}>
            <span>Saldo a favor</span>
            <span className="font-data">−{formatearPrecio(creditToApply)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "18px 0 4px" }}>
          <span style={{ fontSize: 17 }}>Total a pagar</span>
          <span className="font-data" style={{ fontSize: 28, fontWeight: 600 }}>{formatearPrecio(totalConSaldo)}</span>
        </div>
        <p style={{ margin: "0 0 20px", fontSize: 12.5, color: "var(--text-muted)" }}>
          {saldoCubreTodo ? "Cubierto con saldo · sin pago pendiente" : "IVA incluido · Envío se confirma con tu asesor"}
        </p>
        <button type="button" onClick={() => setAgree((v) => !v)} style={{ display: "flex", gap: 12, alignItems: "flex-start", textAlign: "left", fontSize: 13.5, lineHeight: 1.5, color: "var(--text-muted)", marginBottom: 18 }}>
          <span style={{ width: 18, height: 18, borderRadius: 3, flex: "0 0 auto", display: "grid", placeItems: "center", border: `1px solid ${agree ? "var(--accent)" : "var(--border-input)"}`, background: agree ? "var(--accent)" : "transparent", color: "var(--bg-base)", fontSize: 12 }}>
            {agree && "✓"}
          </span>
          <span>{textoAcuerdo}</span>
        </button>
        {error && !tipoErrorGeneral && <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--danger-text)" }}>{error}</p>}
        <Boton
          anchoCompleto
          tamano="lg"
          disabled={!agree || !addressId || (!saldoCubreTodo && metodo === "tarjeta" && estadoFormularioTarjeta !== "listo")}
          cargando={deshabilitadoPorEnvio}
          textoCargando={textoCargando}
          onClick={alPulsarBoton}
        >
          {etiquetaBoton}
        </Boton>
        {estadoEnvio === "procesando" && (
          <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text-muted)" }}>Tu banco puede pedirte confirmar la compra.</p>
        )}
        {!saldoCubreTodo && metodo !== "comprobante" && (
          <p style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "14px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--text-muted)" }}>
            <IconoCandado />
            {metodo === "tarjeta"
              ? "Pago procesado por Stripe. Nosotros nunca vemos ni guardamos los datos de tu tarjeta."
              : "Pago procesado por Stripe."}
          </p>
        )}
      </aside>
      <style>{`
        @media (max-width: 899px) { .pagar-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}

function IconoCandado() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flex: "0 0 auto", marginTop: 1 }} aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** diseño-pagos-stripe.md §2.6 "Éxito tarjeta" (P2.5). Mismo patrón ya
 * usado en `FormularioComprobante.tsx` (círculo de 76 px `--success`).
 * Nunca dice "pedido confirmado": el estado real lo decide el webhook +
 * la revisión humana (RN-11/RN-12). */
function PantallaExitoTarjeta({ folio, total }: { folio: string; total: number }) {
  const router = useRouter();
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <span style={{ display: "inline-grid", placeItems: "center", width: 76, height: 76, border: "1.5px solid var(--success)", borderRadius: "50%", color: "var(--success)", fontSize: 34 }}>✓</span>
      {/* `<h2>`, no `<h1>`: esta pantalla vive dentro de /pagar, que ya
       * puso "Confirmar pedido" como `<h1>` (page.tsx) — jerarquía de
       * encabezados válida en vez de dos `<h1>` en la misma página. */}
      <h2 style={{ margin: "26px 0 0", fontSize: "clamp(26px,2.8vw,38px)", lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-primary)" }}>
        Recibimos tu pago
      </h2>
      <p style={{ margin: "16px auto 0", maxWidth: "56ch", fontSize: 16.5, lineHeight: 1.6, color: "var(--text-muted)" }}>
        Tu pago del pedido <span className="font-data">{folio}</span> por {formatearPrecio(total)} fue aceptado por tu banco. Ahora lo
        revisamos y te avisamos cuando tu pedido esté listo para envío (normalmente en menos de 24 horas).
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 30 }}>
        <Boton tamano="lg" onClick={() => router.push(`/mi-cuenta/pedidos/${folio}`)}>Ver mi pedido</Boton>
        <Boton variante="secundaria" tamano="lg" onClick={() => router.push("/catalogo")}>Seguir comprando</Boton>
      </div>
    </div>
  );
}
