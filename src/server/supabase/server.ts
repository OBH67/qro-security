import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/server/config/env";

/**
 * Cliente de Supabase con la sesión del usuario (respeta RLS).
 * `arquitectura.md` §6.1: es el cliente **default** para Server Components
 * y Server Actions. Nunca usar el cliente `service_role` (`admin.ts`) para
 * lecturas normales de catálogo.
 *
 * No se le pasa el genérico `Database`: con un esquema escrito a mano
 * (`src/types/database.ts`, sin `supabase gen types` porque este entorno no
 * tiene acceso a un proyecto real — ver `.devsquad/estado.md`) la inferencia
 * de tipos de `@supabase/postgrest-js` sobre cadenas de `select` con joins
 * es demasiado estricta y colapsa a `never` en casos válidos. La seguridad
 * de tipos se mantiene en la frontera de cada función de
 * `src/server/db/queries/`, que sí declara su tipo de retorno explícito.
 */
export async function crearClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Se llama desde un Server Component sin permiso de escritura.
            // Es seguro ignorarlo: el middleware refresca la sesión cuando
            // exista (Épica B). El catálogo público no depende de sesión.
          }
        },
      },
    },
  );
}
