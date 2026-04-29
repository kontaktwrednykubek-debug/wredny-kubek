-- Tabela metod wysyłki (admin może edytować z poziomu panelu).
create table if not exists public.shipping_methods (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,            -- np. "inpost_paczkomat"
  name text not null,                   -- "Paczkomat InPost"
  description text not null default '',
  price_grosze integer not null default 0,
  requires_parcel_code boolean not null default false,
  carrier text,                         -- "inpost" | "dpd" | "dhl" | "poczta" | "kurier"
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

alter table public.shipping_methods enable row level security;

-- Każdy może czytać aktywne metody (potrzebne na checkout).
drop policy if exists "shipping_methods: read all" on public.shipping_methods;
create policy "shipping_methods: read all" on public.shipping_methods
  for select using (true);

-- Tylko admin pisze.
drop policy if exists "shipping_methods: admin write" on public.shipping_methods;
create policy "shipping_methods: admin write" on public.shipping_methods
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed domyślnych metod (idempotentnie).
insert into public.shipping_methods (code, name, description, price_grosze, requires_parcel_code, carrier, sort_order)
values
  ('inpost_paczkomat', 'Paczkomat InPost', 'Odbiór 24/7 z najbliższego paczkomatu', 1499, true,  'inpost',  10),
  ('inpost_kurier',    'Kurier InPost',    'Dostawa pod wskazany adres',           1899, false, 'inpost',  20),
  ('dpd_kurier',       'Kurier DPD',       'Standardowa dostawa kurierska',        1999, false, 'dpd',     30),
  ('dhl_kurier',       'Kurier DHL',       'Szybka dostawa kurierska',             2199, false, 'dhl',     40),
  ('poczta_polska',    'Poczta Polska',    'Przesyłka pocztowa priorytetowa',      1299, false, 'poczta',  50),
  ('odbior_osobisty',  'Odbiór osobisty',  'Odbiór po wcześniejszym ustaleniu',       0, false, null,     999)
on conflict (code) do nothing;

-- Pola dla etykiet wysyłkowych (Furgonetka).
alter table public.orders
  add column if not exists shipping_label_url text,
  add column if not exists shipping_tracking_number text,
  add column if not exists shipping_label_status text,
  add column if not exists shipping_carrier text,
  add column if not exists shipping_requested_at timestamptz;
