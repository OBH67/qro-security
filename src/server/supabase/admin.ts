import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/server/config/env";

/**
 * Cliente con la llave `service_role` (salta RLS). `arquitectura.md` §6.1:
 * permitido SOLO en los cinco casos que ahí se listan — en este incremento,
 * los que tocan pedidos, comprobantes y las funciones transaccionales de
 * concurrencia (§9.1). Nunca se usa para lecturas normales del catálogo ni
 * para nada que el cliente pudiera hacer con su propia sesión.
 *
 * El candado real está en el nombre de la variable (sin `NEXT_PUBLIC_`,
 * arquitectura §6.2 candado 1) y en la regla de ESLint `no-restricted-
 * imports` (candado 3) que impide importar este archivo desde `src/app/`
 * o `src/components/`. Toda escritura pasa por `src/server/actions/`.
 *
 * Mismo criterio que `server.ts`: no se le pasa el genérico `Database` —
 * con un esquema escrito a mano, la inferencia de `.rpc()` de
 * `@supabase/postgrest-js` es demasiado estricta. Cada mutación en
 * `src/server/db/mutations/` tipa su propio parámetro y retorno.
 */
export function crearClienteAdmin() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
