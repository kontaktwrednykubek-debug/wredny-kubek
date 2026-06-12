"use client";

import * as React from "react";
import Lottie from "lottie-react";
import confettiData from "../../public/konfeti.json";

export function ConfettiLottie() {
  const [visible, setVisible] = React.useState(true);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    >
      <Lottie
        animationData={confettiData}
        loop={false}
        autoplay
        onComplete={() => setVisible(false)}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
