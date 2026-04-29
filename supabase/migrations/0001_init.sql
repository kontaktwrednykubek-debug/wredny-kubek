-- Schemat bazowy: profile + projekty + zamówienia.
-- Uruchom w Supabase SQL Editor lub przez `supabase db push`.

create type user_role as enum ('USER', 'ADMIN');

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  role user_role not null default 'USER',
  created_at timestamptz not null default now()
);

create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  product_id text not null,
  data jsonb not null,
  preview_url text,
  created_at timestamptz not null default now()
);

create type order_status as enum (
  'PENDING', 'PAID', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CANCELLED'
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  design_id uuid references public.designs(id) on delete set null,
  product_id text not null,
  amount_grosze integer not null,
  currency text not null default 'PLN',
  status order_status not null default 'PENDING',
  stripe_session_id text,
  print_file_url text,
  created_at timestamptz not null default now()
);

-- Trigger: auto-tworzenie profilu po rejestracji
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Backfill: jeśli ktoś zarejestrował się PRZED uruchomieniem tej migracji,
-- utwórz mu profil z auth.users (jednorazowy catch-up).
insert into public.profiles (id, email)
select u.id, u.email
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- RLS
alter table public.profiles enable row level security;
alter table public.designs  enable row level security;
alter table public.orders   enable row level security;

create policy "profiles: own row" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "designs: own rows" on public.designs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "orders: own rows" on public.orders
  for select using (auth.uid() = user_id);

-- ADMIN bypass: funkcja security definer omija RLS (brak nieskończonej rekurencji).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

create policy "admin: full access profiles" on public.profiles
  for all using (public.is_admin());
create policy "admin: full access designs" on public.designs
  for all using (public.is_admin());
create policy "admin: full access orders" on public.orders
  for all using (public.is_admin());
