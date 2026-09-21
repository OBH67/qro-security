import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { AddressRow, BillingProfileRow } from "@/types/database";

/** Lecturas de identidad del cliente (B3). Cliente con sesión — RLS ya
 * filtra a "solo lo propio" (modelo-datos.md §5). */

export async function obtenerDireccionesDeCliente(userId: string): Promise<AddressRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar tus direcciones: ${error.message}`);
  return data ?? [];
}

export async function obtenerDireccionPorId(id: string): Promise<AddressRow | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("addresses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la dirección: ${error.message}`);
  return data;
}

export async function obtenerDatosFiscalesDeCliente(userId: string): Promise<BillingProfileRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("billing_profiles")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`No se pudieron cargar tus datos fiscales: ${error.message}`);
  return data ?? [];
}
