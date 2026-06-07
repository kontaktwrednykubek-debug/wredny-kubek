"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Store, Heart, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function NavBtn({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const cls = `flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
  }`;
  if (onClick) {
    return (
      <button onClick={onClick} className={cls}>
        {icon}
        <span className="text-[10px] font-semibold">{label}</span>
      </button>
    );
  }
  return (
    <Link href={href!} className={cls}>
      {icon}
      <span className="text-[10px] font-semibold">{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [showLoginPopup, setShowLoginPopup] = React.useState(false);
  const [showBubble, setShowBubble] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    const show = setTimeout(() => setShowBubble(true), 10000);
    const hide = setTimeout(() => setShowBubble(false), 16000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  async function handleHeartClick() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      router.push("/account/ulubione");
    } else {
      setShowLoginPopup(true);
    }
  }

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
        style={{ overflow: "visible", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-16 items-center justify-around px-1">
          {/* Home */}
          <NavBtn
            href="/"
            icon={<Home className="h-5 w-5" />}
            label="Home"
            active={pathname === "/"}
          />

          {/* Sklep */}
          <NavBtn
            href="/sklep"
            icon={<Store className="h-5 w-5" />}
            label="Sklep"
            active={pathname.startsWith("/sklep")}
          />

          {/* Center — FAB-style elevated button */}
          <div className="flex flex-col items-center">
            {/* Cup + bubble share the same -translate-y-5 so bubble aligns with cup */}
            <div className="relative -translate-y-5">
              {/* Speech bubble — positioned relative to the cup circle */}
              {showBubble && (
                <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-44 animate-bubble-in rounded-2xl border border-[#40C4A4] bg-white px-3 py-2.5 shadow-lg">
                  <button
                    onClick={(e) => { e.preventDefault(); setShowBubble(false); }}
                    aria-label="Zamknij"
                    className="absolute right-1.5 top-1.5 text-gray-400 text-xs hover:text-gray-600 leading-none"
                  >
                    ×
                  </button>
                  <p className="pr-3 text-xs font-bold leading-snug text-black">
                    Wredny z wyglądu, genialny w środku.
                  </p>
                  <p className="mt-0.5 text-[10px] text-black/60">
                    Kliknij i sprawdź!
                  </p>
                  {/* Arrow pointing down at the cup */}
                  <div className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-[#40C4A4] bg-white" />
                </div>
              )}
              <Link
                href="/sklep"
                aria-label="Wredny Kubek — Sklep"
                onClick={() => setShowBubble(false)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-[0_4px_20px_rgba(0,0,0,0.18)] ring-1 ring-border transition-transform hover:scale-105 active:scale-95"
              >
                <Image
                  src="/wredny.svg"
                  alt="Wredny Kubek"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                  unoptimized
                />
              </Link>
            </div>
          </div>

          {/* Ulubione */}
          <NavBtn
            icon={<Heart className="h-5 w-5" />}
            label="Ulubione"
            active={pathname.startsWith("/account/ulubione")}
            onClick={handleHeartClick}
          />

          {/* Account */}
          <NavBtn
            href={userEmail ? "/account" : "/login"}
            icon={<User className="h-5 w-5" />}
            label={mounted && userEmail ? "Konto" : "Zaloguj"}
            active={pathname.startsWith("/account")}  
          />
        </div>
      </nav>

      {/* Login required popup */}
      {showLoginPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowLoginPopup(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10">
                <Heart className="h-7 w-7 text-rose-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Zaloguj się</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aby przeglądać ulubione produkty, musisz być zalogowany.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                <Link
                  href="/login"
                  className="w-full"
                  onClick={() => setShowLoginPopup(false)}
                >
                  <Button className="w-full">Zaloguj się</Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowLoginPopup(false)}
                >
                  Anuluj
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
