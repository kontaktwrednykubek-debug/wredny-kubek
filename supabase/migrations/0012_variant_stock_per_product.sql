ALTER TABLE shop_products
  ADD COLUMN IF NOT EXISTS variant_stock JSONB NOT NULL DEFAULT '{}'::jsonb;
