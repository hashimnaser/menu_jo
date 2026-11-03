create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  slug text not null unique,
  description text,
  description_en text,
  logo text,
  cover_image text,
  rating numeric(2, 1) not null default 0 check (rating >= 0 and rating <= 5),
  location text,
  location_en text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  google_maps_url text,
  phone text,
  whatsapp text,
  cuisine text,
  cuisine_en text,
  price_level smallint check (price_level between 1 and 3),
  working_hours jsonb not null default '{}'::jsonb,
  is_open_now boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.restaurants
  add column if not exists latitude numeric(9, 6) check (latitude between -90 and 90);
alter table public.restaurants
  add column if not exists longitude numeric(9, 6) check (longitude between -180 and 180);
alter table public.restaurants
  add column if not exists google_maps_url text;
alter table public.restaurants
  add column if not exists name_en text;
alter table public.restaurants
  add column if not exists description_en text;
alter table public.restaurants
  add column if not exists location_en text;
alter table public.restaurants
  add column if not exists whatsapp text;
alter table public.restaurants
  add column if not exists cuisine text;
alter table public.restaurants
  add column if not exists cuisine_en text;
alter table public.restaurants
  add column if not exists price_level smallint check (price_level between 1 and 3);
alter table public.restaurants
  add column if not exists working_hours jsonb not null default '{}'::jsonb;
alter table public.restaurants
  add column if not exists is_open_now boolean not null default true;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint categories_restaurant_name_key unique (restaurant_id, name)
);

alter table public.categories
  add column if not exists name_en text;

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_en text,
  description text,
  description_en text,
  price numeric(10, 2) not null check (price >= 0),
  image text,
  tags text[] not null default '{}',
  is_available boolean not null default true,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint menu_items_category_name_key unique (category_id, name)
);

alter table public.menu_items
  add column if not exists name_en text;
alter table public.menu_items
  add column if not exists description_en text;
alter table public.menu_items
  add column if not exists tags text[] not null default '{}';

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  author_avatar text,
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reviews_restaurant_user_key unique (restaurant_id, user_id)
);

create table if not exists public.restaurant_analytics (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  event_type text not null check (event_type in ('call', 'whatsapp', 'share', 'page_view')),
  created_at timestamptz not null default now()
);

alter table public.reviews
  add column if not exists author_name text;
alter table public.reviews
  add column if not exists author_avatar text;

create or replace function public.sync_review_author_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select
    coalesce(
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'name'), '')
    ),
    coalesce(
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'picture'), '')
    )
  into new.author_name, new.author_avatar
  from auth.users as u
  where u.id = new.user_id;

  return new;
end;
$$;

create or replace function public.sync_review_profiles_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.reviews as r
  set
    author_name = coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'name'), '')
    ),
    author_avatar = coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'picture'), '')
    )
  where r.user_id = new.id;

  return new;
end;
$$;

drop trigger if exists reviews_sync_author_profile on public.reviews;
create trigger reviews_sync_author_profile
  before insert or update on public.reviews
  for each row execute function public.sync_review_author_profile();

drop trigger if exists auth_users_sync_review_profiles on auth.users;
create trigger auth_users_sync_review_profiles
  after update of raw_user_meta_data on auth.users
  for each row execute function public.sync_review_profiles_from_auth_user();

update public.reviews as r
set
  author_name = coalesce(
    nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'name'), '')
  ),
  author_avatar = coalesce(
    nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
    nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'picture'), '')
  )
from auth.users as u
where r.user_id = u.id
  and (
    r.author_name is distinct from coalesce(
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'full_name'), ''),
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'name'), '')
    )
    or r.author_avatar is distinct from coalesce(
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'avatar_url'), ''),
      nullif(pg_catalog.btrim(u.raw_user_meta_data ->> 'picture'), '')
    )
  );

create index if not exists categories_restaurant_id_idx
  on public.categories (restaurant_id);
create index if not exists menu_items_category_id_idx
  on public.menu_items (category_id);
create index if not exists reviews_restaurant_created_at_idx
  on public.reviews (restaurant_id, created_at desc);

alter table public.restaurants enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.reviews enable row level security;
alter table public.restaurant_analytics enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.restaurants, public.categories, public.menu_items
  to anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant insert, update on public.reviews to authenticated;
grant insert on public.restaurant_analytics to anon, authenticated;
revoke select, update, delete on public.restaurant_analytics from anon, authenticated;

drop policy if exists "Public can read restaurants" on public.restaurants;
create policy "Public can read restaurants"
  on public.restaurants for select to anon, authenticated using (true);

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
  on public.categories for select to anon, authenticated using (true);

drop policy if exists "Public can read menu items" on public.menu_items;
create policy "Public can read menu items"
  on public.menu_items for select to anon, authenticated using (true);

drop policy if exists "Public can read reviews" on public.reviews;
create policy "Public can read reviews"
  on public.reviews for select to anon, authenticated using (true);

drop policy if exists "Public can record restaurant analytics" on public.restaurant_analytics;
create policy "Public can record restaurant analytics"
  on public.restaurant_analytics for insert to anon, authenticated
  with check (true);

drop policy if exists "Users can create their own reviews" on public.reviews;
create policy "Users can create their own reviews"
  on public.reviews for insert to authenticated
  with check (
    auth.uid() = user_id
    and auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'
  );

drop policy if exists "Users can update their own reviews" on public.reviews;
create policy "Users can update their own reviews"
  on public.reviews for update to authenticated
  using (
    auth.uid() = user_id
    and auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'
  )
  with check (
    auth.uid() = user_id
    and auth.jwt() -> 'app_metadata' ->> 'provider' = 'google'
  );
