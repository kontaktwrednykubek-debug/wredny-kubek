-- Widoczność kategorii w sklepie (ukrywanie bez usuwania).
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;
