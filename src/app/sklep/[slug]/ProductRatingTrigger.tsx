"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { ReviewsSheet } from "./ReviewsSheet";

type Props = {
  productSlug: string;
  productTitle: string;
  rating: number;
  reviewsCount: number;
};

export function ProductRatingTrigger({
  productSlug,
  productTitle,
  rating,
  reviewsCount,
}: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
        aria-label="Pokaż opinie"
      >
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${
                n <= Math.round(rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground"
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-muted-foreground underline underline-offset-2">
          {rating.toFixed(1)} · {reviewsCount}{" "}
          {reviewsCount === 1
            ? "opinia"
            : reviewsCount < 5
              ? "opinie"
              : "opinii"}
        </span>
      </button>

      <ReviewsSheet
        open={open}
        onClose={() => setOpen(false)}
        productSlug={productSlug}
        productTitle={productTitle}
        initialRating={rating}
        initialCount={reviewsCount}
      />
    </>
  );
}
