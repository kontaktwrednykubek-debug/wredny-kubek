-- Dodaje preview_url do orders (miniatura produktu w historii zamówień).
alter table public.orders
  add column if not exists preview_url text;
