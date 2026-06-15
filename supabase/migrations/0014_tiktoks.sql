-- Sekcja "TikTok / Social media" — karuzela filmów z powiązanymi produktami
create table if not exists tiktoks (
  id            uuid primary key default gen_random_uuid(),
  tiktok_url    text not null,              -- oryginalny link wklejony przez admina
  video_id      text not null,              -- ID filmu wyciągnięte z linku (do embeda)
  thumbnail_url text,                        -- okładka pobrana na stałe do Storage
  title         text,                        -- tytuł / opis z oEmbed
  author        text,                        -- nazwa autora (@konto)
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Powiązane produkty (1-2 na film, ale nie limitujemy twardo w bazie)
create table if not exists tiktok_products (
  id           uuid primary key default gen_random_uuid(),
  tiktok_id    uuid not null references tiktoks(id) on delete cascade,
  product_slug text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists tiktok_products_tiktok_id_idx on tiktok_products(tiktok_id);

-- RLS: czytanie publiczne, zapis tylko service role
alter table tiktoks enable row level security;
alter table tiktok_products enable row level security;

create policy "tiktoks_public_read"
  on tiktoks for select using (true);

create policy "tiktok_products_public_read"
  on tiktok_products for select using (true);

-- Auto updated_at (funkcja set_updated_at istnieje od migracji 0013)
create trigger tiktoks_updated_at
  before update on tiktoks
  for each row execute function set_updated_at();
