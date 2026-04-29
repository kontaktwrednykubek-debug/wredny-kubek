-- Warianty produktu (kolory / rozmiary / inne) + kategoria.
-- Struktura `variants`:
--   {
--     "colors": [{"name":"Czarny","hex":"#000000"}, ...] | null,
--     "sizes":  ["S","M","L","XL"] | null,
--     "options": [{"label":"Pojemność","values":["330ml","500ml"]}] | null
--   }
-- Wszystkie pola są opcjonalne — pokazujemy w UI tylko te, które admin doda.
alter table public.shop_products
  add column if not exists variants jsonb not null default '{}'::jsonb,
  add column if not exists category text not null default 'merch';

create index if not exists shop_products_category_idx
  on public.shop_products (category);
