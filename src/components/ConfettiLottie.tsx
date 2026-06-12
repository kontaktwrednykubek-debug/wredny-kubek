"use client";

import * as React from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import confettiData from "../../public/konfeti.json";

function LottiePlayer({
  animationData,
  onComplete,
  style,
}: {
  animationData: unknown;
  onComplete: () => void;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<LottieRefCurrentProps>(null);
  return (
    <Lottie
      lottieRef={ref}
      animationData={animationData}
      loop={false}
      autoplay
      onDOMLoaded={() => ref.current?.setSpeed(0.75)}
      onComplete={onComplete}
      style={style}
    />
  );
}

export function ConfettiLottie() {
  const [confettiVisible, setConfettiVisible] = React.useState(true);

  return (
    <>
      {/* konfeti.json — pełny ekran */}
      {confettiVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <LottiePlayer
            animationData={confettiData}
            onComplete={() => setConfettiVisible(false)}
            style={{
              width: "150%",
              height: "150%",
              marginLeft: "-25%",
              marginTop: "-25%",
            }}
          />
        </div>
      )}

    </>
  );
}
