"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Home, Store, Heart, ShoppingBag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "@/features/cart/useCart";
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

  React.useEffect(() => setMounted(true), []);

  const totalQty = useCart((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const showBadge = mounted && totalQty > 0;

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

          {/* Center — Wredny Kubek (elevated) */}
          <Link
            href="/sklep"
            aria-label="Wredny Kubek — Sklep"
            className="relative flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-[#40C4A4] shadow-xl ring-[3px] ring-background transition-transform hover:scale-105 active:scale-95"
          >
            <Image
              src="/wredny.svg"
              alt="Wredny Kubek"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              unoptimized
            />
          </Link>

          {/* Ulubione */}
          <NavBtn
            icon={<Heart className="h-5 w-5" />}
            label="Ulubione"
            active={pathname.startsWith("/account/ulubione")}
            onClick={handleHeartClick}
          />

          {/* Koszyk */}
          <Link
            href="/koszyk"
            className={`relative flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
              pathname.startsWith("/koszyk")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -right-2 -top-2 grid h-4 min-w-[16px] place-items-center rounded-full bg-destructive px-0.5 text-[9px] font-bold leading-none text-destructive-foreground">
                  {totalQty > 99 ? "99+" : totalQty}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">Koszyk</span>
          </Link>
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
