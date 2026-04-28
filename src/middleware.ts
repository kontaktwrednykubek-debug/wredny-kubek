import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Middleware:
 *  - odświeża sesję Supabase w cookies (SSR)
 *  - chroni /admin (wymaga roli ADMIN w tabeli `profiles`)
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

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
  if (url.pathname.startsWith("/admin")) {
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
      const home = url.clone();
      home.pathname = "/";
      return NextResponse.redirect(home);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
