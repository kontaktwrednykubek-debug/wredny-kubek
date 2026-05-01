-- ============================================================================
-- KODY RABATOWE / ZNIŻKOWE
-- ============================================================================

-- Tabela kodów rabatowych
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                            -- np. "WIOSNA10" (zapisany uppercase)
  type text not null check (type in ('percent', 'fixed', 'free_shipping')),
  value integer,                                        -- percent: 1-100 | fixed: grosze | free_shipping: NULL

  valid_from timestamptz not null default now(),
  valid_until timestamptz,                              -- NULL = bezterminowo

  max_uses integer,                                     -- NULL = bez limitu globalnego
  times_used integer not null default 0,

  min_order_grosze integer,                             -- NULL = brak minimum
  one_per_user boolean not null default false,

  active boolean not null default true,

  -- Synchronizacja ze Stripe
  stripe_coupon_id text,
  stripe_promotion_code_id text,

  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),

  -- Walidacja: percent w zakresie 1-100, fixed > 0
  constraint discount_value_check check (
    (type = 'percent' and value between 1 and 100) or
    (type = 'fixed' and value > 0) or
    (type = 'free_shipping')
  )
);

create index if not exists discount_codes_code_idx on public.discount_codes (code);
create index if not exists discount_codes_active_idx on public.discount_codes (active);

-- Tabela użyć kodu (do enforcement one_per_user oraz audytu)
create table if not exists public.discount_code_uses (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  discount_grosze integer not null default 0,          -- ile faktycznie odjęto
  used_at timestamptz not null default now()
);

create index if not exists discount_code_uses_user_idx on public.discount_code_uses (user_id);
create index if not exists discount_code_uses_code_idx on public.discount_code_uses (discount_code_id);

-- RLS
alter table public.discount_codes enable row level security;
alter table public.discount_code_uses enable row level security;

-- Użytkownicy NIE mogą czytać listy kodów (żeby nie zgadywać) — walidacja przez API service-role.
-- Tylko admin widzi i pisze.
drop policy if exists "discount_codes: admin all" on public.discount_codes;
create policy "discount_codes: admin all" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- Użytkownik widzi swoje własne użycia; admin widzi wszystko.
drop policy if exists "discount_code_uses: self read" on public.discount_code_uses;
create policy "discount_code_uses: self read" on public.discount_code_uses
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "discount_code_uses: admin all" on public.discount_code_uses;
create policy "discount_code_uses: admin all" on public.discount_code_uses
  for all using (public.is_admin()) with check (public.is_admin());

-- Powiązanie zamówienia z kodem rabatowym (przyda się w panelu admina / historii zamówień)
alter table public.orders
  add column if not exists discount_code_id uuid references public.discount_codes(id) on delete set null,
  add column if not exists discount_grosze integer not null default 0;
