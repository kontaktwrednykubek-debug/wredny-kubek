"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { WrednyChatModal } from "@/components/WrednyChatModal";

export function WrednyChatButton() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#40C4A4] py-2.5 text-sm font-semibold text-[#40C4A4] hover:bg-[#40C4A4]/10 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        Zapytaj Wredny AI 🤖
      </button>
      {open && <WrednyChatModal onClose={() => setOpen(false)} />}
    </>
  );
}
