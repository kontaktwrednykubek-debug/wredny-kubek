"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FlipHorizontal, Download, ShoppingCart, Save, Loader2 } from "lucide-react";
import { useEditorState } from "./hooks/useEditorState";
import { ProductSwitcher } from "./components/ProductSwitcher";
import { AssetUploader } from "./components/AssetUploader";
import { TextControls } from "./components/TextControls";
import { SelectionControls } from "./components/SelectionControls";
import { EditorStage, type EditorStageHandle } from "./components/Stage";
import { Button } from "@/components/ui/button";
import { getProduct, availableProductList } from "@/config/products";
import { formatPrice } from "@/lib/utils";
import { calculatePrice } from "@/lib/pricing";
import {
  exportPrintReadyPng,
  mirrorImageDataUrlAsync,
} from "@/lib/canvas/export";
import { buildGoogleFontsUrl } from "./fonts";
import { useCart } from "@/features/cart/useCart";

/** Doładowuje katalog Google Fonts jednym linkiem (raz, na /edytor). */
function useFontsLoaded() {
  React.useEffect(() => {
    const id = "kubkomania-google-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = buildGoogleFontsUrl();
    document.head.appendChild(link);
  }, []);
}

/**
 * Główny container Edytora — komponuje wszystkie podkomponenty.
 * Trzymamy go zwięzłym (<200 linii). Logika w hookach + lib.
 */
export function EditorContainer() {
  useFontsLoaded();
  const router = useRouter();
  const searchParams = useSearchParams();
  const designIdFromUrl = searchParams.get("id");
  const productIdFromUrl = searchParams.get("productId");
  const lockProduct = searchParams.get("lock") === "1";
  const stageRef = React.useRef<EditorStageHandle>(null);
  const {
    productId,
    mirror,
    toggleMirror,
    elements,
    currentDesignId,
    loadDesign,
    reset,
    setProduct,
  } = useEditorState();
  const product = getProduct(productId);

  // Wymuszony produkt z URL (np. wejście „Personalizuj" z karty produktu).
  React.useEffect(() => {
    if (!productIdFromUrl) return;
    if (productIdFromUrl === productId) return;
    try {
      // setProduct zaakceptuje tylko znane ProductId; inne zignorujemy.
      setProduct(productIdFromUrl as never);
    } catch {
      // ignore
    }
    // celowo bez `productId` w deps — chcemy odpalić tylko przy zmianie URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIdFromUrl]);

  const [loadingDesign, setLoadingDesign] = React.useState(false);

  // Wczytanie istniejącego projektu z URL: /edytor?id=<uuid>
  React.useEffect(() => {
    if (!designIdFromUrl) {
      // Wejście na czysty edytor — wyczyść poprzedni stan
      if (currentDesignId) reset();
      return;
    }
    if (designIdFromUrl === currentDesignId) return;
    let cancelled = false;
    setLoadingDesign(true);
    fetch(`/api/designs/${designIdFromUrl}`)
      .then(async (res) => {
        if (res.status === 401) {
          router.push(`/login?next=/edytor?id=${designIdFromUrl}`);
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (cancelled || !json?.design) return;
        const d = json.design;
        loadDesign({
          id: d.id,
          productId: d.product_id,
          elements: d.data?.elements ?? [],
          mirror: !!d.data?.mirror,
        });
      })
      .finally(() => {
        if (!cancelled) setLoadingDesign(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designIdFromUrl]);

  const [savingState, setSavingState] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);

  const price = calculatePrice(productId, {
    textElements: elements.filter((e) => e.kind === "text").length,
    imageElements: elements.filter((e) => e.kind === "image").length,
  });

  const handleSave = async () => {
    setSavingState("saving");
    setSaveMsg(null);
    try {
      // Wygeneruj miniaturkę z canvas (mała, do listy projektów).
      let previewUrl: string | undefined;
      const stage = stageRef.current?.getStage();
      if (stage) {
        previewUrl = stage.toDataURL({ pixelRatio: 0.5, mimeType: "image/png" });
      }
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDesignId ?? undefined,
          productId,
          data: { elements, mirror },
          previewUrl,
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/edytor");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSavingState("error");
        setSaveMsg(err.error ?? "Nie udało się zapisać projektu");
        return;
      }
      const { design } = await res.json();
      // Po pierwszym zapisie zapamiętujemy id, aby kolejne zapisy aktualizowały rekord.
      if (design?.id && design.id !== currentDesignId) {
        loadDesign({
          id: design.id,
          productId,
          elements,
          mirror,
        });
      }
      setSavingState("saved");
      setSaveMsg("Zapisano! Zobacz w „Twoje konto → Zapisane projekty”");
      setTimeout(() => setSavingState("idle"), 3000);
    } catch (e) {
      setSavingState("error");
      setSaveMsg(e instanceof Error ? e.message : "Błąd zapisu");
    }
  };

  const addToCart = useCart((s) => s.add);

  const handleFinalize = async () => {
    setSavingState("saving");
    setSaveMsg(null);
    try {
      // 1. Wygeneruj miniaturkę.
      let previewUrl: string | undefined;
      const stage = stageRef.current?.getStage();
      if (stage) {
        previewUrl = stage.toDataURL({ pixelRatio: 0.5, mimeType: "image/png" });
      }

      // 2. Zapisz projekt w bazie (wymaga zalogowania).
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentDesignId ?? undefined,
          productId,
          data: { elements, mirror },
          previewUrl,
        }),
      });
      if (res.status === 401) {
        router.push("/login?next=/edytor");
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setSavingState("error");
        setSaveMsg(err.error ?? "Nie udało się zapisać projektu");
        return;
      }
      const { design } = await res.json();

      // 3. Dodaj do koszyka.
      addToCart({
        designId: design?.id ?? null,
        productId,
        unitPriceGr: price,
        previewUrl,
        label: product.name,
      });

      // 4. Przejdź do koszyka.
      setSavingState("saved");
      router.push("/koszyk");
    } catch (e) {
      setSavingState("error");
      setSaveMsg(e instanceof Error ? e.message : "Błąd finalizacji");
    }
  };

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
    <div className="container mx-auto grid w-full min-w-0 max-w-full gap-4 overflow-x-hidden px-3 py-4 sm:gap-6 sm:px-4 sm:py-10 lg:grid-cols-[280px_minmax(0,1fr)_280px]">
      {/* LEWY PANEL */}
      <aside className="order-2 space-y-4 lg:order-1">
        {!lockProduct && availableProductList.length > 1 && (
          <>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Wybierz produkt
            </h3>
            <ProductSwitcher />
          </>
        )}

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Opcje projektu
        </h3>
        <div className="space-y-2">
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
        </div>

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Edycja zaznaczonego
        </h3>
        <SelectionControls />
      </aside>

      {/* CANVAS */}
      <section className="order-1 flex min-w-0 flex-col items-center justify-start gap-4 lg:order-2">
        <p className="text-sm text-muted-foreground">
          {product.name} ·{" "}
          <span className="font-medium text-foreground">
            {product.canvas.widthMm}×{product.canvas.heightMm} mm
          </span>{" "}
          pole nadruku
        </p>
        <div className="mx-auto w-full max-w-md">
          <EditorStage ref={stageRef} />
        </div>
      </section>

      {/* PRAWY PANEL */}
      <aside className="order-3 space-y-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">
          Podsumowanie
        </p>
        <p className="text-3xl font-bold text-primary">{formatPrice(price)}</p>
        <ul className="text-sm text-muted-foreground">
          <li>{product.description}</li>
          <li className="mt-1">Elementy: {elements.length}</li>
        </ul>
        <Button
          onClick={handleSave}
          variant="outline"
          className="w-full"
          disabled={savingState === "saving" || elements.length === 0}
        >
          {savingState === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {savingState === "saving"
            ? "Zapisywanie..."
            : savingState === "saved"
              ? "Zapisano ✓"
              : "Zapisz projekt"}
        </Button>
        {saveMsg && (
          <p
            className={`text-xs ${
              savingState === "error"
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {saveMsg}
          </p>
        )}
        <Button onClick={handleExport} variant="outline" className="w-full">
          <Download className="h-4 w-4" />
          Pobierz plik do druku (PNG 300 DPI)
        </Button>
        <Button
          className="w-full"
          onClick={handleFinalize}
          disabled={savingState === "saving" || elements.length === 0}
        >
          {savingState === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          Finalizuj projekt
        </Button>
      </aside>
    </div>
  );
}
