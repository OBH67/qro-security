import type { InstruccionesPago } from "@/types/database";

/**
 * Espejo, del lado del cliente, de `extraerInstrucciones()`
 * (`src/server/pagos/stripe/webhook.ts`) — arquitectura-pagos-stripe.md §5.
 * El webhook ya guarda estas mismas instrucciones en `payments.instructions`
 * cuando llega `payment_intent.requires_action` (fuente que lee el detalle
 * de "Mis pedidos" tras un refresh, `obtenerInstruccionesPago()`), pero el
 * cliente no puede esperar al webhook para dibujar la ficha justo después
 * de pagar — por eso se repite la misma extracción aquí, sobre el
 * `PaymentIntent` que regresa `stripe.confirmOxxoPayment()` /
 * `stripe.confirmCustomerBalancePayment()` en el navegador.
 *
 * `@stripe/stripe-js` (el SDK de navegador) no tipa `oxxo_display_details`
 * ni `display_bank_transfer_instructions` dentro de `PaymentIntent.NextAction`
 * (solo el paquete `stripe` de servidor, que usa `webhook.ts`, los tipa
 * completos) — el campo SÍ viaja en la respuesta real de la API, solo falta
 * en los `.d.ts` de este paquete. En vez de importar el SDK de servidor
 * (`stripe`) a un archivo que corre en el navegador, se declara aquí la
 * forma mínima documentada de cada uno
 * (docs.stripe.com/api/payment_intents/object, campo `next_action`).
 */
export interface NextActionConVoucherOCLABE {
  oxxo_display_details?: {
    number: string | null;
    hosted_voucher_url: string | null;
  } | null;
  display_bank_transfer_instructions?: {
    reference: string | null;
    financial_addresses?: Array<{
      type: string;
      spei?: { clabe: string | null; bank_name: string | null; account_holder_name: string | null } | null;
    }> | null;
  } | null;
}

export function extraerInstruccionesCliente(nextAction: NextActionConVoucherOCLABE | null | undefined): InstruccionesPago | null {
  const oxxo = nextAction?.oxxo_display_details;
  if (oxxo) {
    return { metodo: "oxxo", referencia: oxxo.number ?? "", urlVoucher: oxxo.hosted_voucher_url ?? "" };
  }

  const transferencia = nextAction?.display_bank_transfer_instructions;
  const direccionMx = transferencia?.financial_addresses?.find((f) => f.type === "mx_bank_transfer");
  if (transferencia && direccionMx?.spei) {
    return {
      metodo: "spei",
      clabe: direccionMx.spei.clabe ?? "",
      banco: direccionMx.spei.bank_name ?? "",
      beneficiario: direccionMx.spei.account_holder_name ?? "",
      referencia: transferencia.reference ?? "",
    };
  }

  return null;
}
