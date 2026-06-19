-- Progi cenowe wg liczby sztuk dla zagranicznych metod wysyłki
-- (analogicznie do shipping_method_tiers dla metod krajowych).
create table if not exists shipping_country_method_tiers (
  id          uuid primary key default gen_random_uuid(),
  method_id   uuid not null references shipping_country_methods(id) on delete cascade,
  min_quantity int not null default 1 check (min_quantity >= 1),
  price_grosze int not null default 0 check (price_grosze >= 0),
  created_at  timestamptz not null default now(),
  unique (method_id, min_quantity)
);

create index if not exists scmt_method_idx on shipping_country_method_tiers(method_id);

alter table shipping_country_method_tiers enable row level security;

create policy "scmt_public_read"
  on shipping_country_method_tiers for select using (true);
