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
        overflow: "hidden",
      }}
    >
      <Lottie
        animationData={confettiData}
        loop={false}
        autoplay
        speed={0.75}
        onComplete={() => setVisible(false)}
        style={{
          width: "150%",
          height: "150%",
          marginLeft: "-25%",
          marginTop: "-25%",
        }}
      />
    </div>
  );
}
