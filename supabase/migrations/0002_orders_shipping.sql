-- Dodaje kolumnę z danymi do wysyłki (jsonb) i quantity do orders.
alter table public.orders
  add column if not exists shipping_info jsonb,
  add column if not exists quantity integer not null default 1;

-- Polityka: użytkownik może utworzyć własne zamówienie.
drop policy if exists "orders: insert own" on public.orders;
create policy "orders: insert own" on public.orders
  for insert with check (auth.uid() = user_id);

-- Polityka: użytkownik może usunąć własne zamówienie.
drop policy if exists "orders: delete own" on public.orders;
create policy "orders: delete own" on public.orders
  for delete using (auth.uid() = user_id);
