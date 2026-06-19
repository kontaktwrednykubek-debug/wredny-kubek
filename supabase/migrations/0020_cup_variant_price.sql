-- Domyślna cena na poziomie globalnego koloru kubka.
-- NULL = brak ceny koloru (użyj ceny bazowej produktu).
-- Produkt może nadpisać tę cenę w variants.cupColors[].priceGrosze.
ALTER TABLE public.cup_color_variants
  ADD COLUMN IF NOT EXISTS price_grosze integer;
