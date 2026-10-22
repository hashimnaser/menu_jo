create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  logo text,
  cover_image text,
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  location text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint categories_restaurant_name_key unique (restaurant_id, name)
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10, 2) not null check (price >= 0),
  image text,
  is_available boolean not null default true,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint menu_items_category_name_key unique (category_id, name)
);

create index if not exists categories_restaurant_id_idx
  on public.categories (restaurant_id);
create index if not exists menu_items_category_id_idx
  on public.menu_items (category_id);

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.restaurants, public.categories, public.menu_items
  to anon, authenticated;

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
  on public.restaurants for select to anon, authenticated using (true);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select to anon, authenticated using (true);

drop policy if exists "Public can read menu items" on public.menu_items;
create policy "Public can read menu items"
  on public.menu_items for select to anon, authenticated using (true);
