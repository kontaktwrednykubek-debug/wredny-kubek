-- ============================================================================
-- OPINIE OGÓLNE (strona /opinie) — nieprzypięte do produktu
-- ============================================================================
-- Opinie dodawane na stronie /opinie mają product_slug = NULL.
-- Klucz obcy product_reviews_product_slug_fkey zostaje (NULL go nie łamie),
-- więc stare opinie produktowe dalej wskazują na istniejące produkty.

alter table public.product_reviews
  alter column product_slug drop not null;

-- Jedna ogólna opinia na użytkownika (unikalność (product_slug, user_id)
-- nie działa dla NULL, więc dokładamy osobny indeks częściowy).
create unique index if not exists product_reviews_general_user_unique
  on public.product_reviews (user_id)
  where product_slug is null;
