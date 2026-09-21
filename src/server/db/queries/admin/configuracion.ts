import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";

const LLAVES_BANCARIAS = ["bank_name", "beneficiary", "clabe", "account_number"] as const;
const LLAVES_CONTACTO = ["admin_email", "admin_whatsapp"] as const;
const LLAVES_PLAZOS = ["return_window_days", "order_auto_cancel_days"] as const;

const TODAS_LAS_LLAVES = [...LLAVES_BANCARIAS, ...LLAVES_CONTACTO, ...LLAVES_PLAZOS];

export interface ConfiguracionAdmin {
  bankName: string | null;
  beneficiary: string | null;
  clabe: string | null;
  accountNumber: string | null;
  adminEmail: string | null;
  adminWhatsapp: string | null;
  returnWindowDays: string | null;
  orderAutoCancelDays: string | null;
}

export interface UltimaModificacionSeccion {
  cuando: string;
  quien: string;
}

/** H4.2: las 8 llaves que edita esta pantalla, agrupadas como en
 * `panel-admin-maqueta.html:960-1013` (bancarios / contacto / plazos). */
export async function obtenerConfiguracionAdmin(): Promise<{
  configuracion: ConfiguracionAdmin;
  ultimaModificacion: { bancarios: UltimaModificacionSeccion | null; contacto: UltimaModificacionSeccion | null; plazos: UltimaModificacionSeccion | null };
}> {
  const supabase = await crearClienteServidor();

  const { data: filas, error } = await supabase.from("settings").select("key, value").in("key", TODAS_LAS_LLAVES);
  if (error) throw new Error(`No se pudo cargar la configuración: ${error.message}`);

  const porLlave = new Map((filas ?? []).map((f) => [f.key, f.value]));
  const configuracion: ConfiguracionAdmin = {
    bankName: porLlave.get("bank_name") ?? null,
    beneficiary: porLlave.get("beneficiary") ?? null,
    clabe: porLlave.get("clabe") ?? null,
    accountNumber: porLlave.get("account_number") ?? null,
    adminEmail: porLlave.get("admin_email") ?? null,
    adminWhatsapp: porLlave.get("admin_whatsapp") ?? null,
    returnWindowDays: porLlave.get("return_window_days") ?? null,
    orderAutoCancelDays: porLlave.get("order_auto_cancel_days") ?? null,
  };

  const { data: bitacora, error: errorBitacora } = await supabase
    .from("admin_change_log")
    .select("entity_id, changed_at, changed_by")
    .eq("entity_type", "setting")
    .in("entity_id", TODAS_LAS_LLAVES)
    .order("changed_at", { ascending: false });
  if (errorBitacora) throw new Error(`No se pudo cargar la bitácora de configuración: ${errorBitacora.message}`);

  const idsPerfiles = [...new Set((bitacora ?? []).map((b) => b.changed_by).filter((id): id is string => Boolean(id)))];
  const { data: perfiles, error: errorPerfiles } = idsPerfiles.length > 0 ? await supabase.from("profiles").select("id, first_name, last_name").in("id", idsPerfiles) : { data: [], error: null };
  if (errorPerfiles) throw new Error(`No se pudieron cargar los responsables de la bitácora: ${errorPerfiles.message}`);
  const nombrePorPerfil = new Map((perfiles ?? []).map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]));

  function ultimaDe(llaves: readonly string[]): UltimaModificacionSeccion | null {
    const fila = (bitacora ?? []).find((b) => llaves.includes(b.entity_id));
    if (!fila) return null;
    return { cuando: fila.changed_at, quien: fila.changed_by ? (nombrePorPerfil.get(fila.changed_by) ?? "—") : "—" };
  }

  return {
    configuracion,
    ultimaModificacion: {
      bancarios: ultimaDe(LLAVES_BANCARIAS),
      contacto: ultimaDe(LLAVES_CONTACTO),
      plazos: ultimaDe(LLAVES_PLAZOS),
    },
  };
}

export { LLAVES_BANCARIAS, LLAVES_CONTACTO, LLAVES_PLAZOS };
