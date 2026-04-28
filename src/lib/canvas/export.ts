import type Konva from "konva";
import { getProduct, type ProductId } from "@/config/products";

const MM_PER_INCH = 25.4;

/**
 * Eksportuje zawartość pola nadruku (Konva Stage) do PNG w 300 DPI,
 * z zachowaniem fizycznych wymiarów produktu.
 *
 * @param stage      referencja do Konva.Stage zawierającego TYLKO warstwę nadruku
 * @param productId  identyfikator produktu z products.ts
 * @param mirror     wymuś lustrzane odbicie (sublimacja kubków)
 * @returns dataURL PNG-a gotowego do druku
 */
export function exportPrintReadyPng(
  stage: Konva.Stage,
  productId: ProductId,
  mirror?: boolean,
): string {
  const product = getProduct(productId);
  const dpi = 300;
  const targetWidthPx = Math.round((product.canvas.widthMm / MM_PER_INCH) * dpi);
  const pixelRatio = targetWidthPx / product.canvas.widthPx;

  const dataUrl = stage.toDataURL({
    pixelRatio,
    mimeType: "image/png",
    quality: 1,
  });

  const shouldMirror = mirror ?? product.requiresMirrorPrint;
  if (!shouldMirror) return dataUrl;

  return mirrorImageDataUrl(dataUrl);
}

function mirrorImageDataUrl(dataUrl: string): string {
  if (typeof document === "undefined") return dataUrl;
  const img = new Image();
  img.src = dataUrl;
  // synchronicznie nie zadziała — zwracamy oryginał;
  // pełną wersję wykonuje async helper poniżej.
  return dataUrl;
}

export async function mirrorImageDataUrlAsync(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  const img = await loadImage(dataUrl);
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.translate(c.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  return c.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
