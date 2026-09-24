import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/server/config/env";

/**
 * Refresco de cookies de sesión (arquitectura.md §4, ahí referido como
 * `src/middleware.ts` — este proyecto corre Next.js 16, donde ese archivo
 * se renombró a `proxy.ts`, ver `node_modules/next/dist/docs/01-app/03-api
 * -reference/03-file-conventions/proxy.md`) y candado de capa 1 (§6.4) de
 * `/mi-cuenta` y `/admin`: sin sesión, redirige antes de renderizar nada.
 *
 * `/admin` (H2) exige además el ROL de staff, no solo sesión — esa
 * verificación necesita una consulta a `profiles` que aquí sería una
 * consulta extra en cada request; se deja para la capa 2
 * (`admin/(protegido)/layout.tsx`, `obtenerSesionStaff()`), que ya la
 * hace de cualquier forma para pintar nombre/rol en el sidebar. Este
 * proxy también inyecta `x-pathname`: un Server Component de layout no
 * tiene forma nativa de leer la URL actual (a diferencia de una `page`,
 * que recibe `params`), y H5.2 la necesita para decidir "acceso
 * denegado" sin redirigir.
 */
export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getClaims(), no getUser(): valida el JWT localmente (llaves asimétricas)
  // en vez de ir a Supabase Auth en CADA request, prefetch incluido. Igual
  // refresca la sesión vencida y escribe las cookies nuevas vía setAll.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  if (!user && request.nextUrl.pathname.startsWith("/mi-cuenta")) {
    const redirigirA = new URL("/ingresar", request.url);
    redirigirA.searchParams.set("siguiente", request.nextUrl.pathname);
    return NextResponse.redirect(redirigirA);
  }

  if (!user && request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/ingresar") {
    return NextResponse.redirect(new URL("/admin/ingresar", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Corre en todo excepto assets estáticos, `_next` (mismo criterio
     * estándar recomendado por Supabase para Next.js App Router) y el
     * webhook de Stripe (arquitectura-pagos-stripe.md §5: Stripe nunca
     * manda cookies de sesión — el refresco que hace este proxy no le
     * aplica, y agregarlo solo sumaría trabajo a cada evento entrante).
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks/stripe|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
