export type DiscountType =
  | "percent"
  | "fixed"
  | "free_shipping"
  /** Gratis — bez obniżki ceny, opis w gift_description. */
  | "gift"
  /** X% taniej na jedną (najtańszą) sztukę przy min. 2 szt. w koszyku. */
  | "second_percent"
  /** X zł taniej na jedną (najtańszą) sztukę przy min. 2 szt. w koszyku. */
  | "second_fixed";

/** Pozycja koszyka potrzebna do wyliczenia rabatu „na drugą sztukę". */
export interface DiscountCartItem {
  unitPriceGr: number;
  quantity: number;
}

export interface ScratchBatch {
  id: string;
  name: string;
  type: DiscountType;
  value: number | null;
  gift_description: string | null;
  prefix: string | null;
  valid_from: string;
  valid_until: string | null;
  min_order_grosze: number | null;
  active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  /** percent: 1-100, fixed: grosze, free_shipping: null */
  value: number | null;
  valid_from: string;
  valid_until: string | null;
  max_uses: number | null;
  times_used: number;
  min_order_grosze: number | null;
  one_per_user: boolean;
  active: boolean;
  stripe_coupon_id: string | null;
  stripe_promotion_code_id: string | null;
  scratch_batch_id?: string | null;
  gift_description?: string | null;
  reserved_by?: string | null;
  reserved_until?: string | null;
  created_at: string;
  created_by: string | null;
}

export interface DiscountValidationResult {
  valid: boolean;
  error?: string;
  code?: {
    id: string;
    code: string;
    type: DiscountType;
    value: number | null;
    stripe_promotion_code_id: string | null;
    gift_description: string | null;
    is_scratch: boolean;
  };
  /** Ile faktycznie zostanie odjęte (w groszach). */
  discountGrosze: number;
}
