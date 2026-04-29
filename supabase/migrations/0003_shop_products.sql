-- Tabela gotowych produktów sklepu (zarządzana przez admina).
create table if not exists public.shop_products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  price_grosze integer not null check (price_grosze >= 0),
  currency text not null default 'PLN',
  images jsonb not null default '[]'::jsonb,         -- tablica URL-i, max 10 (walidacja w API)
  specs jsonb not null default '{}'::jsonb,           -- dane techniczne klucz/wartość
  rating numeric(2,1) not null default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer not null default 0 check (reviews_count >= 0),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shop_products_published_idx
  on public.shop_products (is_published, created_at desc);

-- RLS
alter table public.shop_products enable row level security;

-- Każdy może czytać opublikowane produkty.
drop policy if exists "shop_products: read published" on public.shop_products;
create policy "shop_products: read published" on public.shop_products
  for select using (is_published = true);

-- Admin (rola ADMIN w profiles) ma pełny dostęp.
drop policy if exists "shop_products: admin all" on public.shop_products;
create policy "shop_products: admin all" on public.shop_products
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN'
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN'
    )
  );

-- Storage bucket dla zdjęć produktów (publiczny odczyt).
insert into storage.buckets (id, name, public)
values ('shop-products', 'shop-products', true)
on conflict (id) do nothing;

-- Tylko admin może uploadować/usuwać pliki w buckecie shop-products.
drop policy if exists "shop-products: admin write" on storage.objects;
create policy "shop-products: admin write" on storage.objects
  for all using (
    bucket_id = 'shop-products'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN'
    )
  ) with check (
    bucket_id = 'shop-products'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'ADMIN'
    )
  );

-- Każdy może czytać pliki (bucket jest publiczny).
drop policy if exists "shop-products: public read" on storage.objects;
create policy "shop-products: public read" on storage.objects
  for select using (bucket_id = 'shop-products');

-- Trigger na updated_at.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists shop_products_updated_at on public.shop_products;
create trigger shop_products_updated_at
  before update on public.shop_products
  for each row execute function public.set_updated_at();
