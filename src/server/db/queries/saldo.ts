import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { CreditMovementRow } from "@/types/database";

/** D3.1/D2 (§4.4): el saldo del cliente es SUM(amount), nunca un contador
 * separado — mismo criterio que la función SQL `aplicar_saldo()` usa para
 * validar que nunca quede negativo. Cliente con sesión — RLS
 * `credit_movements_select_own` ya filtra a "solo lo propio". */
export async function obtenerMovimientosSaldo(userId: string): Promise<CreditMovementRow[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("credit_movements")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`No se pudo cargar tu saldo: ${error.message}`);
  return data ?? [];
}

export async function obtenerSaldoDisponible(userId: string): Promise<number> {
  const movimientos = await obtenerMovimientosSaldo(userId);
  return movimientos.reduce((suma, m) => suma + Number(m.amount), 0);
}
