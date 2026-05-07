ALTER TABLE cup_color_variants
  ADD COLUMN IF NOT EXISTS stock_count INT NOT NULL DEFAULT 0;

ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS show_variant_stock BOOLEAN NOT NULL DEFAULT false;
