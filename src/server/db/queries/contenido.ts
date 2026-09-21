import "server-only";
import { crearClienteServidor } from "@/server/supabase/server";
import type { LegalPageRow } from "@/types/database";

/** Contenido editorial de solo lectura pública (`legal_pages`, 0006) —
 * distinto de `catalogo.ts` porque no es catálogo de producto. */
export async function obtenerPaginaLegal(slug: LegalPageRow["slug"]): Promise<LegalPageRow | null> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("legal_pages").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`No se pudo cargar la página: ${error.message}`);
  return data;
}
