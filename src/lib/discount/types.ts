export type DiscountType = "percent" | "fixed" | "free_shipping";

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
  };
  /** Ile faktycznie zostanie odjęte (w groszach). */
  discountGrosze: number;
}
