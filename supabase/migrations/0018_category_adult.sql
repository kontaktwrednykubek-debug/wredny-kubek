-- Oznaczenie kategorii jako "18+" (treści dla dorosłych) — wymaga
-- potwierdzenia wieku przy wejściu do tej kategorii w sklepie.
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS is_adult boolean NOT NULL DEFAULT false;
