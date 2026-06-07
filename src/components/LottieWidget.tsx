"use client";

import React, { useState, useRef, useEffect } from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import Link from "next/link";
import animationData from "../../public/animacja-wredny-kubek.json";

export function LottieWidget() {
  const [visible, setVisible] = useState(true);
  const [lottieEmpty, setLottieEmpty] = useState(false);
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

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative group">
        <button
          onClick={() => setVisible(false)}
          aria-label="Zamknij widget"
          className="absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
        >
          ×
        </button>
        <Link href="/sklep" aria-label="Przejdź do sklepu">
          <div
            data-lottie-widget
            className="relative h-20 w-20 cursor-pointer hover:scale-110 transition-transform duration-200 rounded-full bg-[#141414] shadow-2xl shadow-black/60 ring-2 ring-teal-400/50 overflow-hidden flex items-center justify-center"
          >
            {/* Lottie layer — visible if JSON is valid */}
            <div className={`absolute inset-0 ${lottieEmpty ? "opacity-0" : "opacity-100"}`}>
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            {/* CSS fallback — visible if Lottie renders nothing */}
            {lottieEmpty && (
              <div className="flex flex-col items-center justify-center gap-0.5 animate-wiggle">
                <span className="text-3xl leading-none" style={{ filter: "drop-shadow(0 0 6px rgba(61,224,204,0.7))" }}>
                  ☕
                </span>
                <span className="text-[9px] font-bold tracking-widest text-teal-400 uppercase">
                  sklep
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>
    </div>
  );
}
