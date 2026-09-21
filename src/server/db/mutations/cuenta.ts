import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { DatosDireccion } from "@/lib/esquemas/direccion";
import type { DatosFiscales } from "@/lib/esquemas/datosFiscales";
import type { AddressRow, BillingProfileRow } from "@/types/database";

/**
 * Escrituras de identidad (B3). Usan el cliente CON SESIÓN, no el
 * `service_role`: la política RLS `addresses_own` / `billing_profiles_own`
 * (modelo-datos.md §5) ya garantiza "solo lo propio" — no hace falta saltar
 * RLS para algo que el dueño de la fila puede hacer por sí mismo
 * (arquitectura.md §6.1, la llave privilegiada es solo para lo que el
 * usuario NO puede hacer con su propia sesión).
 */

export async function crearDireccion(userId: string, datos: DatosDireccion): Promise<AddressRow> {
  const supabase = await crearClienteServidor();

  if (datos.isDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: userId,
      label: datos.label,
      street: datos.street,
      ext_number: datos.extNumber,
      int_number: datos.intNumber || null,
      postal_code: datos.postalCode,
      neighborhood: datos.neighborhood,
      municipality: datos.municipality,
      state: datos.state,
      recipient_name: datos.recipientName,
      directions: datos.directions || null,
      is_default: datos.isDefault ?? false,
    })
    .select("*")
    .single();

  if (error) throw new Error(`No se pudo guardar la dirección: ${error.message}`);
  return data;
}

export async function eliminarDireccion(userId: string, addressId: string): Promise<void> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("user_id", userId);
  if (error) throw new Error(`No se pudo eliminar la dirección: ${error.message}`);
}

export async function crearDatosFiscales(userId: string, datos: DatosFiscales): Promise<BillingProfileRow> {
  const supabase = await crearClienteServidor();

  if (datos.isDefault) {
    await supabase.from("billing_profiles").update({ is_default: false }).eq("user_id", userId);
  }

  const { data, error } = await supabase
    .from("billing_profiles")
    .insert({
      user_id: userId,
      rfc: datos.rfc,
      legal_name: datos.legalName,
      tax_regime: datos.taxRegime,
      cfdi_use: datos.cfdiUse,
      postal_code: datos.postalCode,
      is_default: datos.isDefault ?? true,
    })
    .select("*")
    .single();

  if (error) throw new Error(`No se pudieron guardar tus datos fiscales: ${error.message}`);
  return data;
}

export async function eliminarDatosFiscales(userId: string, billingProfileId: string): Promise<void> {
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("billing_profiles")
    .delete()
    .eq("id", billingProfileId)
    .eq("user_id", userId);
  if (error) throw new Error(`No se pudieron eliminar los datos fiscales: ${error.message}`);
}
