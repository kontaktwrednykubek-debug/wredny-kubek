"use client";

import * as React from "react";
import Image from "next/image";
import { useAssistantStore } from "@/features/assistant/useAssistantStore";

export function FABWidget() {
  const open = useAssistantStore((s) => s.open);

  React.useEffect(() => {
    if (sessionStorage.getItem("assistant_auto_shown")) return;
    const t = setTimeout(() => {
      open();
      sessionStorage.setItem("assistant_auto_shown", "1");
    }, 20000);
    return () => clearTimeout(t);
  }, [open]);

  return (
    <button
      onClick={open}
      aria-label="Wredny Doradca AI"
      className="fixed bottom-6 right-6 z-50 hidden h-16 w-16 items-center justify-center rounded-full bg-card shadow-[0_4px_24px_rgba(0,0,0,0.22)] ring-1 ring-border transition-transform hover:scale-110 active:scale-95 animate-pulse-scale md:flex"
    >
      <Image
        src="/wredny.svg"
        alt="Wredny Doradca"
        width={48}
        height={48}
        className="h-12 w-12 object-contain"
        unoptimized
      />
    </button>
  );
}
