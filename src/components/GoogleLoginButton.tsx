"use client";

import * as React from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleLoginButton({ next = "/account" }: { next?: string }) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      console.error("Błąd autoryzacji Google:", error.message);
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
    >
      {isLoading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
      ) : (
        <>
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.353 2.655 1.41 6.533l3.856 3.232z"
            />
            <path
              fill="#34A853"
              d="M16.04 15.345c-1.077.736-2.423 1.164-4.04 1.164-3.555 0-6.564-2.418-7.636-5.673L.473 14.04C2.41 17.936 6.39 20.6 11.25 20.6c3.127 0 5.964-1.036 8.045-2.81l-3.255-2.445z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.273c0-.818-.073-1.609-.209-2.373H11.25v4.51h6.873a5.877 5.877 0 0 1-2.545 3.845l3.255 2.445c1.909-1.764 3.155-4.354 3.155-7.427z"
            />
            <path
              fill="#FBBC05"
              d="M4.364 13.136A6.993 6.993 0 0 1 4 12c0-.395.036-.782.109-1.155L.253 7.614C.09 8.973 0 10.427 0 12s.09 3.027.253 4.386l4.111-3.25z"
            />
          </svg>
          Kontynuuj przez Google
        </>
      )}
    </button>
  );
}
