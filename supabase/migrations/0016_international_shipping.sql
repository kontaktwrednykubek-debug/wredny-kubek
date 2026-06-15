-- Przesyłki zagraniczne: kraje + metody wysyłki per kraj.
-- Krajowe (Polska) metody zostają w shipping_methods bez zmian.

create table if not exists shipping_countries (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,            -- ISO np. 'DE', 'CZ'
  name        text not null,            -- 'Niemcy'
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists shipping_country_methods (
  id                            uuid primary key default gen_random_uuid(),
  country_id                    uuid not null references shipping_countries(id) on delete cascade,
  name                          text not null,            -- 'Kurier DPD', 'Paczkomat InPost'
  carrier                       text,
  price_grosze                  int not null default 0 check (price_grosze >= 0),
  requires_parcel_code          boolean not null default false,
  free_shipping_threshold_grosze int,
  sort_order                    int not null default 0,
  is_active                     boolean not null default true,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

create index if not exists shipping_country_methods_country_idx
  on shipping_country_methods(country_id);

-- RLS: czytanie publiczne, zapis tylko service role
alter table shipping_countries enable row level security;
alter table shipping_country_methods enable row level security;

create policy "shipping_countries_public_read"
  on shipping_countries for select using (true);

create policy "shipping_country_methods_public_read"
  on shipping_country_methods for select using (true);

-- Auto updated_at (funkcja set_updated_at istnieje od migracji 0013)
create trigger shipping_countries_updated_at
  before update on shipping_countries
  for each row execute function set_updated_at();

create trigger shipping_country_methods_updated_at
  before update on shipping_country_methods
  for each row execute function set_updated_at();
