"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/features/cart/useCart";

export function CartIcon() {
  // unikamy hydration mismatch — zustand+persist hydratuje po renderze
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const totalQty = useCart((s) =>
    s.items.reduce((sum, i) => sum + i.quantity, 0),
  );
  const showBadge = mounted && totalQty > 0;

  return (
    <Link href="/koszyk" className="relative">
      <Button variant="ghost" size="icon" aria-label="Koszyk">
        <ShoppingBag className="h-5 w-5" />
      </Button>
      {showBadge && (
        <span
          aria-label={`${totalQty} w koszyku`}
          className="pointer-events-none absolute -right-0.5 -top-0.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground shadow-sm"
        >
          {totalQty > 99 ? "99+" : totalQty}
        </span>
      )}
    </Link>
  );
}
