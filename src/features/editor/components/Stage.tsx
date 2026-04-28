"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type Konva from "konva";
import { useEditorState } from "../hooks/useEditorState";
import { getProduct } from "@/config/products";

/**
 * Komponenty react-konva są ŁADOWANE TYLKO PO STRONIE KLIENTA
 * (Konva potrzebuje window).
 */
const Stage = dynamic(() => import("react-konva").then((m) => m.Stage), {
  ssr: false,
});
const Layer = dynamic(() => import("react-konva").then((m) => m.Layer), {
  ssr: false,
});
const Rect = dynamic(() => import("react-konva").then((m) => m.Rect), {
  ssr: false,
});
const KText = dynamic(() => import("react-konva").then((m) => m.Text), {
  ssr: false,
});
const KImage = dynamic(() => import("react-konva").then((m) => m.Image), {
  ssr: false,
});

export type EditorStageHandle = {
  getStage: () => Konva.Stage | null;
};

export const EditorStage = React.forwardRef<EditorStageHandle>(
  function EditorStage(_props, ref) {
    const stageRef = React.useRef<Konva.Stage | null>(null);
    const { productId, elements, selectedId, select, updateElement } =
      useEditorState();
    const product = getProduct(productId);
    const { widthPx, heightPx } = product.canvas;

    React.useImperativeHandle(ref, () => ({
      getStage: () => stageRef.current,
    }));

    return (
      <div
        className="relative overflow-hidden rounded-2xl border border-border shadow-inner"
        style={{ background: product.sceneBg, width: widthPx, height: heightPx }}
      >
        <Stage
          ref={(s: Konva.Stage | null) => {
            stageRef.current = s;
          }}
          width={widthPx}
          height={heightPx}
          onMouseDown={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.target === e.target.getStage()) select(null);
          }}
        >
          <Layer>
            {/* tło pola nadruku */}
            <Rect
              x={0}
              y={0}
              width={widthPx}
              height={heightPx}
              fill="rgba(255,255,255,0.0)"
              listening={false}
            />

            {elements.map((el) => {
              if (el.kind === "text") {
                return (
                  <KText
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    text={el.text}
                    fontSize={el.fontSize}
                    fontFamily={el.fontFamily}
                    fill={el.fill}
                    rotation={el.rotation}
                    draggable
                    onClick={() => select(el.id)}
                    onTap={() => select(el.id)}
                    onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
                      updateElement(el.id, { x: e.target.x(), y: e.target.y() })
                    }
                    stroke={selectedId === el.id ? "#1ea69a" : undefined}
                    strokeWidth={selectedId === el.id ? 1 : 0}
                  />
                );
              }
              return (
                <ImageNode
                  key={el.id}
                  el={el}
                  selected={selectedId === el.id}
                  onSelect={() => select(el.id)}
                  onMove={(x, y) => updateElement(el.id, { x, y })}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  },
);

function ImageNode({
  el,
  selected,
  onSelect,
  onMove,
}: {
  el: { id: string; x: number; y: number; width: number; height: number; src: string; rotation: number };
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}) {
  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  React.useEffect(() => {
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.src = el.src;
    i.onload = () => setImg(i);
  }, [el.src]);
  if (!img) return null;
  return (
    <KImage
      image={img}
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      rotation={el.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
        onMove(e.target.x(), e.target.y())
      }
      stroke={selected ? "#1ea69a" : undefined}
      strokeWidth={selected ? 1 : 0}
    />
  );
}
