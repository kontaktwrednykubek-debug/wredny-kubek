-- Upsell w koszyku: "Kubek w ciemno" (losowy wzór) — dokupka za stałą cenę
-- Pojedynczy rekord konfiguracyjny edytowany z panelu admina.
create table if not exists mystery_mug_config (
  id           uuid primary key default gen_random_uuid(),
  enabled      boolean not null default false,
  price_grosze int not null default 2000 check (price_grosze >= 0),
  label        text not null default 'Kubek w ciemno (losowy wzór)',
  description  text not null default 'Zaskocz się! Wylosujemy dla Ciebie kubek 330 ml z naszej kolekcji.',
  image_url    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Domyślny rekord
insert into mystery_mug_config (enabled, price_grosze, label)
values (true, 2000, 'Kubek w ciemno (losowy wzór)');

-- RLS: czytanie publiczne, zapis tylko service role
alter table mystery_mug_config enable row level security;

create policy "mystery_mug_public_read"
  on mystery_mug_config for select using (true);

-- Auto updated_at (funkcja set_updated_at istnieje od migracji 0013)
create trigger mystery_mug_updated_at
  before update on mystery_mug_config
  for each row execute function set_updated_at();
