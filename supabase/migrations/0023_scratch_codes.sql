-- ============================================================================
-- RABATY ZDRAPKI — pule jednorazowych, unikalnych kodów
-- ============================================================================
-- Każda pula (scratch_batches) to jedna akcja zdrapek o wspólnych regułach.
-- Same kody trafiają do istniejącej tabeli discount_codes (max_uses = 1),
-- dzięki czemu działają w całym istniejącym przepływie: koszyk → zamówienie →
-- Stripe → webhook (licznik times_used blokuje ponowne użycie).
--
-- Nowe typy rabatu (dla zdrapek):
--   gift            — gratis (opis w gift_description), bez obniżki ceny
--   second_percent  — X% taniej na JEDNĄ sztukę (najtańszą) przy min. 2 szt.
--   second_fixed    — X zł taniej na JEDNĄ sztukę (najtańszą) przy min. 2 szt.

create table if not exists public.scratch_batches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in (
    'percent', 'fixed', 'free_shipping', 'gift', 'second_percent', 'second_fixed'
  )),
  value integer,                       -- percent: 1-100 | fixed: grosze | inne: NULL
  gift_description text,               -- opis gratisu (dla type = 'gift')
  prefix text,                         -- prefiks kodów, np. "ZDR"
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  min_order_grosze integer,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

alter table public.scratch_batches enable row level security;

drop policy if exists "scratch_batches: admin all" on public.scratch_batches;
create policy "scratch_batches: admin all" on public.scratch_batches
  for all using (public.is_admin()) with check (public.is_admin());

-- Powiązanie kodu z pulą zdrapek + opis gratisu
alter table public.discount_codes
  add column if not exists scratch_batch_id uuid references public.scratch_batches(id) on delete cascade,
  add column if not exists gift_description text;

create index if not exists discount_codes_scratch_batch_idx
  on public.discount_codes (scratch_batch_id);

-- Rozszerzenie dozwolonych typów rabatu
alter table public.discount_codes drop constraint if exists discount_codes_type_check;
alter table public.discount_codes add constraint discount_codes_type_check check (
  type in ('percent', 'fixed', 'free_shipping', 'gift', 'second_percent', 'second_fixed')
);

alter table public.discount_codes drop constraint if exists discount_value_check;
alter table public.discount_codes add constraint discount_value_check check (
  (type in ('percent', 'second_percent') and value between 1 and 100) or
  (type in ('fixed', 'second_fixed') and value > 0) or
  (type in ('free_shipping', 'gift'))
);
