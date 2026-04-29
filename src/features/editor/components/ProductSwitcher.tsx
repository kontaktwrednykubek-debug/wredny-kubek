"use client";

import { availableProductList as productList } from "@/config/products";
import { useEditorState } from "../hooks/useEditorState";
import { cn } from "@/lib/utils";

export function ProductSwitcher() {
  const { productId, setProduct } = useEditorState();
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {productList.map((p) => (
        <button
          key={p.id}
          onClick={() => setProduct(p.id)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition",
            productId === p.id
              ? "border-primary bg-primary/10 text-primary"
              : "border-border hover:border-primary/40",
          )}
        >
          <span className="text-2xl">
            {p.id === "mug" && "☕"}
            {p.id === "tshirt" && "👕"}
            {p.id === "notebook" && "📓"}
            {p.id === "keychain" && "🔑"}
          </span>
          <span className="font-medium">{p.name.split(" ")[0]}</span>
        </button>
      ))}
    </div>
  );
}
