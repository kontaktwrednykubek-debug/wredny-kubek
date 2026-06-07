"use client";

import React, { useState, useRef, useEffect } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import Link from "next/link";
import Image from "next/image";
import animationData from "../../public/animacja-wredny-kubek.json";

export function LottieWidget() {
  const [visible, setVisible] = useState(true);
  const [lottieEmpty, setLottieEmpty] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const lottieRef = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = lottieRef.current;
      if (!el) { setLottieEmpty(true); return; }
      const svg = document.querySelector("[data-lottie-widget] svg");
      const paths = svg ? svg.querySelectorAll("path, circle, rect, ellipse, polygon, polyline") : [];
      const hasContent = Array.from(paths).some((p) => {
        const d = p.getAttribute("d") ?? "";
        return d.length > 10;
      });
      if (!hasContent) setLottieEmpty(true);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const show = setTimeout(() => setShowBubble(true), 10000);
    const hide = setTimeout(() => setShowBubble(false), 16000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Speech bubble */}
      {showBubble && (
        <div className="relative max-w-[210px] animate-bubble-in rounded-2xl border border-[#40C4A4] bg-white px-4 py-3 shadow-lg">
          <button
            onClick={() => setShowBubble(false)}
            aria-label="Zamknij dymek"
            className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center text-gray-400 text-xs hover:text-gray-600"
          >
            ×
          </button>
          <p className="pr-4 text-sm font-bold leading-snug text-black">
            Wredny z wyglądu, genialny w środku.
          </p>
          <p className="mt-1 text-xs text-black/60">
            Kliknij i sprawdź, co potrafię
          </p>
          {/* Arrow pointing down toward the cup */}
          <div className="absolute -bottom-[9px] right-8 h-4 w-4 rotate-45 border-b border-r border-[#40C4A4] bg-white" />
        </div>
      )}

      {/* FAB */}
      <div className="relative group">
        <button
          onClick={() => setVisible(false)}
          aria-label="Zamknij widget"
          className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 text-xs opacity-0 shadow transition-opacity group-hover:opacity-100"
        >
          ×
        </button>
        <Link href="/sklep" aria-label="Przejdź do sklepu" onClick={() => setShowBubble(false)}>
          <div
            data-lottie-widget
            className="relative h-[92px] w-[92px] cursor-pointer animate-pulse-scale drop-shadow-2xl"
          >
            {/* Lottie layer — visible if JSON is valid */}
            <div className={`absolute inset-0 ${lottieEmpty ? "pointer-events-none opacity-0" : "opacity-100"}`}>
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* SVG fallback — visible if Lottie renders nothing */}
            {lottieEmpty && (
              <Image
                src="/wredny.svg"
                alt="Wredny Kubek"
                width={92}
                height={92}
                className="h-full w-full object-contain"
                unoptimized
              />
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
