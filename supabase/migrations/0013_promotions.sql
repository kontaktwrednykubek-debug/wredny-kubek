-- Tabela automatycznych promocji "kup X dostaniesz Y gratis"
create table if not exists promotions (
  id          uuid primary key default gen_random_uuid(),
  active      boolean not null default false,
  buy_qty     int not null default 3 check (buy_qty >= 1),
  get_qty     int not null default 1 check (get_qty >= 1),
  label       text not null default 'Kup 3, dostaniesz 4. gratis!',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Tylko jeden rekord - wstawiamy domyślny (active=true od razu)
insert into promotions (active, buy_qty, get_qty, label)
values (true, 3, 1, 'Kup 3, dostaniesz 4. gratis!');

-- RLS: czytanie publiczne, zapis tylko service role
alter table promotions enable row level security;

create policy "promotions_public_read"
  on promotions for select
  using (true);

-- Aktualizacja updated_at automatycznie
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger promotions_updated_at
  before update on promotions
  for each row execute function set_updated_at();
