"use client";

import * as React from "react";
import { FlipHorizontal, Download, ShoppingCart } from "lucide-react";
import { useEditorState } from "./hooks/useEditorState";
import { ProductSwitcher } from "./components/ProductSwitcher";
import { AssetUploader } from "./components/AssetUploader";
import { TextControls } from "./components/TextControls";
import { EditorStage, type EditorStageHandle } from "./components/Stage";
import { Button } from "@/components/ui/button";
import { getProduct } from "@/config/products";
import { formatPrice } from "@/lib/utils";
import { calculatePrice } from "@/lib/pricing";
import {
  exportPrintReadyPng,
  mirrorImageDataUrlAsync,
} from "@/lib/canvas/export";

/**
 * Główny container Edytora — komponuje wszystkie podkomponenty.
 * Trzymamy go zwięzłym (<200 linii). Logika w hookach + lib.
 */
export function EditorContainer() {
  const stageRef = React.useRef<EditorStageHandle>(null);
  const { productId, mirror, toggleMirror, elements } = useEditorState();
  const product = getProduct(productId);

  const price = calculatePrice(productId, {
    textElements: elements.filter((e) => e.kind === "text").length,
    imageElements: elements.filter((e) => e.kind === "image").length,
  });

  const handleExport = async () => {
    const stage = stageRef.current?.getStage();
    if (!stage) return;
    let url = exportPrintReadyPng(stage, productId);
    if (mirror || product.requiresMirrorPrint) {
      url = await mirrorImageDataUrlAsync(url);
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productId}-print.png`;
    a.click();
  };

  return (
    <div className="container mx-auto grid gap-6 px-4 py-10 lg:grid-cols-[280px_1fr_280px]">
      {/* LEWY PANEL */}
      <aside className="space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Wybierz produkt
        </h3>
        <ProductSwitcher />

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Opcje projektu
        </h3>
        <TextControls />
        <AssetUploader />

        <Button
          variant={mirror ? "primary" : "outline"}
          size="sm"
          onClick={toggleMirror}
          className="w-full justify-start"
        >
          <FlipHorizontal className="h-4 w-4" />
          Lustrzane odbicie {mirror ? "(WŁ)" : ""}
        </Button>
      </aside>

      {/* CANVAS */}
      <section className="flex flex-col items-center justify-start gap-3">
        <p className="text-sm text-muted-foreground">
          {product.name} ·{" "}
          <span className="font-medium text-foreground">
            {product.canvas.widthMm}×{product.canvas.heightMm} mm
          </span>{" "}
          pole nadruku
        </p>
        <EditorStage ref={stageRef} />
      </section>

      {/* PRAWY PANEL */}
      <aside className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          Podsumowanie
        </p>
        <p className="text-3xl font-bold text-primary">{formatPrice(price)}</p>
        <ul className="text-sm text-muted-foreground">
          <li>{product.description}</li>
          <li className="mt-1">Elementy: {elements.length}</li>
        </ul>
        <Button onClick={handleExport} variant="outline" className="w-full">
          <Download className="h-4 w-4" />
          Pobierz plik do druku (PNG 300 DPI)
        </Button>
        <Button className="w-full">
          <ShoppingCart className="h-4 w-4" />
          Finalizuj projekt
        </Button>
      </aside>
    </div>
  );
}
