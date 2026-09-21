import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/server/config/env";

/**
 * Refresco de cookies de sesión (arquitectura.md §4, ahí referido como
 * `src/middleware.ts` — este proyecto corre Next.js 16, donde ese archivo
 * se renombró a `proxy.ts`, ver `node_modules/next/dist/docs/01-app/03-api
 * -reference/03-file-conventions/proxy.md`) y candado de `/mi-cuenta`
 * (equivalente al de `/admin` en §6.4, capa 1): sin sesión, redirige a
 * `/ingresar` antes de renderizar nada. El panel `/admin` no es parte de
 * este incremento — su candado se agrega cuando exista (H2).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/mi-cuenta")) {
    const redirigirA = new URL("/ingresar", request.url);
    redirigirA.searchParams.set("siguiente", request.nextUrl.pathname);
    return NextResponse.redirect(redirigirA);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Corre en todo excepto assets estáticos y `_next` — mismo criterio
     * estándar recomendado por Supabase para Next.js App Router.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
