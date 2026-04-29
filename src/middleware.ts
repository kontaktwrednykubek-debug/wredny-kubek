import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Middleware:
 *  - odświeża sesję Supabase w cookies
 *  - chroni /account/*
 *  - chroni TAJNĄ ścieżkę admina (env.ADMIN_URL_SECRET) — wymaga roli ADMIN
 *  - dla każdego innego zapytania o `/{cokolwiek}` które wygląda jak slug
 *    admina ALE nim nie jest — pozwala App Routerowi zwrócić zwykłe 404
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (name: string) => request.cookies.get(name)?.value,
        set: (name: string, value: string, options: CookieOptions) =>
          response.cookies.set({ name, value, ...options }),
        remove: (name: string, options: CookieOptions) =>
          response.cookies.set({ name, value: "", ...options }),
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl;
  const adminBase = `/${env.ADMIN_URL_SECRET}`;

  // Stary publiczny adres /admin — udajemy 404 zamiast redirect.
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return new NextResponse(null, { status: 404 });
  }

  // Tajna ścieżka admina — wymagaj zalogowanego użytkownika z rolą ADMIN.
  if (url.pathname === adminBase || url.pathname.startsWith(`${adminBase}/`)) {
    if (!user) {
      const login = url.clone();
      login.pathname = "/login";
      login.searchParams.set("next", url.pathname);
      return NextResponse.redirect(login);
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "ADMIN") {
      return new NextResponse(null, { status: 404 });
    }
  }

  // /account/* — wymaga zalogowania
  if (url.pathname.startsWith("/account")) {
    if (!user) {
      const login = url.clone();
      login.pathname = "/login";
      login.searchParams.set("next", url.pathname);
      return NextResponse.redirect(login);
    }
  }

  return response;
}

export const config = {
  // Uruchamiaj middleware tylko dla ścieżek które mogą wymagać autoryzacji.
  // Plus catch-all root — w razie gdyby ktoś trafił na `adminSlug` bez auth.
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    // każda jedno-segmentowa ścieżka root: /xyz, /panel-secret itp.
    "/:path",
  ],
};
