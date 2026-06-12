"use client";

import * as React from "react";
import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import confettiData from "../../public/konfeti.json";
import thankYouData from "../../public/thank-you-lottie.json";

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
  const [thankYouVisible, setThankYouVisible] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setThankYouVisible(true), 500);
    return () => clearTimeout(t);
  }, []);

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

      {/* thank-you-lottie.json — wycentrowany na środku, po 0.5s */}
      {thankYouVisible && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          <LottiePlayer
            animationData={thankYouData}
            onComplete={() => setThankYouVisible(false)}
            style={{ width: "min(520px, 90vw)", height: "auto" }}
          />
        </div>
      )}
    </>
  );
}
