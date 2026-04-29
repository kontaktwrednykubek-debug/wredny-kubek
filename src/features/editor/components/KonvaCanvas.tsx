"use client";

import * as React from "react";
import {
  Stage,
  Layer,
  Rect,
  Text as KText,
  Image as KImage,
  Transformer,
} from "react-konva";
import type Konva from "konva";
import { useEditorState } from "../hooks/useEditorState";
import { getProduct } from "@/config/products";
import type { ImageElement, TextElement } from "../types";

type Props = {
  stageRef: React.MutableRefObject<Konva.Stage | null>;
};

export default function KonvaCanvas({ stageRef }: Props) {
  const { productId, elements, selectedId, select, updateElement } =
    useEditorState();
  const product = getProduct(productId);
  const { widthPx, heightPx } = product.canvas;

  // mapowanie id elementu -> referencja do węzła Konva (do Transformera)
  const nodeRefs = React.useRef<Map<string, Konva.Node>>(new Map());
  const transformerRef = React.useRef<Konva.Transformer | null>(null);

  // gdy zmieni się zaznaczenie — przepnij Transformer na ten węzeł
  React.useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }
    const node = nodeRefs.current.get(selectedId);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    }
  }, [selectedId, elements]);

  return (
    <Stage
      ref={(s: Konva.Stage | null) => {
        stageRef.current = s;
      }}
      width={widthPx}
      height={heightPx}
      onMouseDown={(e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.target === e.target.getStage()) select(null);
      }}
      onTouchStart={(e: Konva.KonvaEventObject<TouchEvent>) => {
        if (e.target === e.target.getStage()) select(null);
      }}
    >
      <Layer>
        <Rect
          x={0}
          y={0}
          width={widthPx}
          height={heightPx}
          fill="rgba(255,255,255,0)"
          listening={false}
        />

        {elements.map((el) =>
          el.kind === "text" ? (
            <TextNode
              key={el.id}
              el={el}
              registerRef={(node) => {
                if (node) nodeRefs.current.set(el.id, node);
                else nodeRefs.current.delete(el.id);
              }}
              onSelect={() => select(el.id)}
              onChange={(patch) => updateElement(el.id, patch)}
            />
          ) : (
            <ImageNode
              key={el.id}
              el={el}
              registerRef={(node) => {
                if (node) nodeRefs.current.set(el.id, node);
                else nodeRefs.current.delete(el.id);
              }}
              onSelect={() => select(el.id)}
              onChange={(patch) => updateElement(el.id, patch)}
            />
          ),
        )}

        <Transformer
          ref={transformerRef}
          rotateEnabled
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
          ]}
          boundBoxFunc={(oldBox, newBox) => {
            // minimalny rozmiar
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      </Layer>
    </Stage>
  );
}

// ============== TEXT NODE ==============

function TextNode({
  el,
  registerRef,
  onSelect,
  onChange,
}: {
  el: TextElement;
  registerRef: (n: Konva.Text | null) => void;
  onSelect: () => void;
  onChange: (patch: Partial<TextElement>) => void;
}) {
  // styl: Konva przyjmuje "bold", "italic", "bold italic", lub ""
  const fontStyle = [el.bold && "bold", el.italic && "italic"]
    .filter(Boolean)
    .join(" ") || "normal";
  const textDecoration = el.underline ? "underline" : "";

  return (
    <KText
      ref={registerRef}
      x={el.x}
      y={el.y}
      text={el.text}
      fontSize={el.fontSize}
      fontFamily={el.fontFamily}
      fontStyle={fontStyle}
      textDecoration={textDecoration}
      align={el.align ?? "left"}
      letterSpacing={el.letterSpacing ?? 0}
      lineHeight={el.lineHeight ?? 1.2}
      width={el.width}
      fill={el.fill}
      rotation={el.rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) =>
        onChange({ x: e.target.x(), y: e.target.y() })
      }
      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => {
        const node = e.target as Konva.Text;
        const scaleX = node.scaleX();
        const newFontSize = Math.max(8, el.fontSize * scaleX);
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          fontSize: newFontSize,
        });
      }}
    />
  );
}

// ============== IMAGE NODE ==============

function ImageNode({
  el,
  registerRef,
  onSelect,
  onChange,
}: {
  el: ImageElement;
  registerRef: (n: Konva.Image | null) => void;
  onSelect: () => void;
  onChange: (patch: Partial<ImageElement>) => void;
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
      ref={registerRef}
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
        onChange({ x: e.target.x(), y: e.target.y() })
      }
      onTransformEnd={(e: Konva.KonvaEventObject<Event>) => {
        const node = e.target as Konva.Image;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(10, el.width * scaleX),
          height: Math.max(10, el.height * scaleY),
        });
      }}
    />
  );
}
