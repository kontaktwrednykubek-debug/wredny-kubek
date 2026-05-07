ALTER TABLE shop_products ADD COLUMN IF NOT EXISTS body TEXT;

CREATE TABLE IF NOT EXISTS cup_color_variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  image_url   TEXT,
  sort_order  INT  NOT NULL DEFAULT 100,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE cup_color_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cup_variants_public_read" ON cup_color_variants
  FOR SELECT USING (true);

CREATE POLICY "cup_variants_admin_write" ON cup_color_variants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );
