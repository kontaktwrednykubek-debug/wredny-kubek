export type TextAlign = "left" | "center" | "right";

export type TextElement = {
  id: string;
  kind: "text";
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  rotation: number;
  // formatowanie (Canva-style)
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: TextAlign;
  letterSpacing?: number;
  lineHeight?: number;
  width?: number; // do textu wieloliniowego z align
};

export type ImageElement = {
  id: string;
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  rotation: number;
};

export type DesignElement = TextElement | ImageElement;

export type DesignData = {
  elements: DesignElement[];
};
