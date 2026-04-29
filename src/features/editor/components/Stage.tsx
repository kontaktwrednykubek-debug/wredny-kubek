"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import { useEditorState } from "../hooks/useEditorState";
import { getProduct } from "@/config/products";

/**
 * Lazy-load całego modułu Konva (jeden chunk, bez SSR).
 * Patrz: src/features/editor/components/KonvaCanvas.tsx
 */
const KonvaCanvas = dynamic(() => import("./KonvaCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Ładowanie edytora…
    </div>
  ),
});

export type EditorStageHandle = {
  getStage: () => Konva.Stage | null;
};

type StageContainerProps = {
  width: number;
  height: number;
  background: string;
};

const StageContainer = React.forwardRef<EditorStageHandle, StageContainerProps>(
  function StageContainer({ width, height, background }, ref) {
    const stageRef = React.useRef<Konva.Stage | null>(null);
    const wrapperRef = React.useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = React.useState(1);

    React.useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    // Skalujemy canvas do szerokości kontenera (responsywność na mobile).
    // Konva stage pozostaje w natywnym rozmiarze (ekspor PNG 300 DPI bez straty jakości),
    // skalowanie odbywa się czystym CSS transform.
    React.useEffect(() => {
      if (!wrapperRef.current) return;
      const el = wrapperRef.current;
      const update = () => {
        const available = el.clientWidth;
        const next = Math.min(1, available / width);
        setScale(Number.isFinite(next) && next > 0 ? next : 1);
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(el);
      return () => ro.disconnect();
    }, [width]);

    return (
      <div ref={wrapperRef} className="w-full" style={{ height: height * scale }}>
        <div
          className="relative overflow-hidden rounded-2xl border border-border shadow-inner"
          style={{
            background,
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <KonvaCanvas stageRef={stageRef} />
        </div>
      </div>
    );
  },
);

export const EditorStage = React.forwardRef<EditorStageHandle>(
  function EditorStage(_, ref) {
    const productId = useEditorState((s) => s.productId);
    const product = getProduct(productId);
    return (
      <StageContainer
        ref={ref}
        width={product.canvas.widthPx}
        height={product.canvas.heightPx}
        background={product.sceneBg}
      />
    );
  },
);
