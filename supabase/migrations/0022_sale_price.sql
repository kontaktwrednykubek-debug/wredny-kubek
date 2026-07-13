-- Cena promocyjna (wyprzedaż). NULL = brak obniżki.
-- Gdy ustawiona i niższa od price_grosze, produkt jest "na wyprzedaży":
-- karty pokazują badge -X%, a klient płaci sale_price_grosze.
alter table public.shop_products
  add column if not exists sale_price_grosze integer;
