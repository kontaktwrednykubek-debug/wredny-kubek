-- Specyfikacja techniczna na poziomie globalnego koloru kubka.
-- materials  — z czego wykonany (wiele): np. {'Ceramika','Porcelana'}
-- extra_info — informacje dodatkowe (wiele): np. {'Możliwość mycia w zmywarce'}
-- Zaznaczone raz przy kolorze pojawiają się automatycznie na każdym produkcie
-- z tym kolorem (specyfikacja zmienia się wraz z wybranym wariantem).
ALTER TABLE public.cup_color_variants
  ADD COLUMN IF NOT EXISTS materials  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extra_info text[] NOT NULL DEFAULT '{}';
