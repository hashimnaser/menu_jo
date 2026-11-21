create extension if not exists pgcrypto;

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name_ar text not null,
  name_en text,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

alter table public.restaurants
  add column if not exists name_ar text,
  add column if not exists logo_url text,
  add column if not exists cover_url text;

update public.restaurants
set
  name_ar = coalesce(name_ar, name),
  logo_url = coalesce(logo_url, logo),
  cover_url = coalesce(cover_url, cover_image);

alter table public.categories
  add column if not exists sort_order integer not null default 0;

alter table public.menu_items
  add column if not exists meal_type text;

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete restrict,
  branch_name_ar text not null,
  branch_name_en text,
  address_ar text,
  address_en text,
  google_maps_url text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  phone text,
  whatsapp text,
  working_hours jsonb not null default '{}'::jsonb,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name_ar text not null,
  name_en text,
  price numeric(10, 2) not null check (price >= 0),
  image_url text,
  tags text[] not null default '{}',
  description_ar text,
  description_en text,
  meal_type text not null default 'أخرى',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  unique (category_id, name_ar)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'items_meal_type_check'
      and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_meal_type_check check (
        meal_type in (
          'شاورما دجاج عربي',
          'ساندويتش شاورما',
          'بروستد',
          'منسف',
          'برغر لحم',
          'برغر دجاج',
          'مناقيش',
          'مشاوي',
          'وجبات عائلية',
          'مشروبات',
          'أخرى'
        )
      );
  end if;
end $$;

insert into public.cities (name_ar, name_en, slug)
values
  ('إربد', 'Irbid', 'irbid'),
  ('عمّان', 'Amman', 'amman'),
  ('الزرقاء', 'Zarqa', 'zarqa')
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en;

insert into public.areas (city_id, name_ar, name_en, slug)
select cities.id, seed.name_ar, seed.name_en, seed.slug
from public.cities as cities
cross join (
  values
    ('شارع الهاشمي', 'Al Hashemi Street', 'al-hashemi'),
    ('شارع الثلاثين', 'Al Thalathin Street', 'al-thalathin'),
    ('الحي الشرقي', 'Al Hay Al Sharqi', 'east-neighborhood'),
    ('شارع الجامعة', 'University Street', 'university-street')
) as seed(name_ar, name_en, slug)
where cities.slug = 'irbid'
on conflict (city_id, slug) do update set
  name_ar = excluded.name_ar,
  name_en = excluded.name_en;

insert into public.branches (
  restaurant_id, area_id, branch_name_ar, branch_name_en,
  address_ar, address_en, google_maps_url, latitude, longitude,
  phone, whatsapp, working_hours, is_open
)
select
  r.id,
  a.id,
  case
    when r.name_ar ilike '%الهاشمي%' or r.location ilike '%الهاشمي%' then 'فرع الهاشمي'
    when r.name_ar ilike '%الثلاثين%' or r.location ilike '%الثلاثين%' then 'فرع شارع الثلاثين'
    else 'الفرع الرئيسي'
  end,
  null,
  coalesce(r.location, r.location_en),
  r.location_en,
  r.google_maps_url,
  r.latitude,
  r.longitude,
  r.phone,
  r.whatsapp,
  r.working_hours,
  r.is_open_now
from public.restaurants r
join lateral (
  select ar.id
  from public.areas ar
  join public.cities c on c.id = ar.city_id
  where c.slug = 'irbid'
    and (
      (r.location ilike '%الهاشمي%' and ar.slug = 'al-hashemi')
      or (r.location ilike '%الثلاثين%' and ar.slug = 'al-thalathin')
      or ar.slug = 'al-hashemi'
    )
  order by
    case
      when r.location ilike '%الهاشمي%' and ar.slug = 'al-hashemi' then 0
      when r.location ilike '%الثلاثين%' and ar.slug = 'al-thalathin' then 1
      else 2
    end
  limit 1
) a on true
where not exists (
  select 1 from public.branches b where b.restaurant_id = r.id
);

insert into public.items (
  category_id, name_ar, name_en, price, image_url, tags,
  description_ar, description_en, meal_type, is_available
)
select
  mi.category_id,
  mi.name,
  mi.name_en,
  mi.price,
  mi.image,
  mi.tags,
  mi.description,
  mi.description_en,
  case
    when mi.name_ar ilike '%مشروب%' then 'مشروبات'
    when mi.name_ar ilike '%عائلي%' or mi.name_ar ilike '%سطل%' then 'وجبات عائلية'
    when mi.name_ar ilike '%منسف%' then 'منسف'
    when mi.name_ar ilike '%بروستد%' then 'بروستد'
    when mi.name_ar ilike '%مناقيش%' or mi.name_ar ilike '%منقوش%' then 'مناقيش'
    when mi.name_ar ilike '%مشاوي%' or mi.name_ar ilike '%تكة%' or mi.name_ar ilike '%شيش%' then 'مشاوي'
    when mi.name_ar ilike '%زنجر%' then 'برغر دجاج'
    when mi.name_ar ilike '%برغر%' or mi.name_ar ilike '%برجر%' then
      case
        when mi.name_ar ilike '%دجاج%' or mi.name_ar ilike '%فراخ%' then 'برغر دجاج'
        else 'برغر لحم'
      end
    when mi.name_ar ilike '%عربي%' or mi.name_ar ilike '%حلبي%' or mi.name_ar ilike '%فرنسي%' or mi.name_ar ilike '%إيطالي%' or mi.name_ar ilike '%شاورمجي%' then 'ساندويتش شاورما'
    when mi.name_ar ilike '%شاورما%' then
      case
        when mi.name_ar ilike '%دجاج%' and mi.name_ar ilike '%عربي%' then 'شاورما دجاج عربي'
        when mi.name_ar ilike '%ساندويتش%' or mi.name_ar ilike '%ساندويش%' then 'ساندويتش شاورما'
        else 'ساندويتش شاورما'
      end
    else 'أخرى'
  end,
  mi.is_available
from (
  select mi.*,
         mi.name as name_ar
  from public.menu_items mi
) mi
on conflict (category_id, name_ar) do update set
  name_en = excluded.name_en,
  price = excluded.price,
  image_url = excluded.image_url,
  tags = excluded.tags,
  description_ar = excluded.description_ar,
  description_en = excluded.description_en,
  meal_type = case
    when public.items.meal_type = 'أخرى' then excluded.meal_type
    else public.items.meal_type
  end,
  is_available = excluded.is_available;

alter table public.cities enable row level security;
alter table public.areas enable row level security;
alter table public.branches enable row level security;
alter table public.items enable row level security;

grant select on public.cities, public.areas, public.branches, public.items
  to anon, authenticated;

drop policy if exists "Public can read cities" on public.cities;
create policy "Public can read cities" on public.cities
  for select to anon, authenticated using (true);

drop policy if exists "Public can read areas" on public.areas;
create policy "Public can read areas" on public.areas
  for select to anon, authenticated using (true);

drop policy if exists "Public can read branches" on public.branches;
create policy "Public can read branches" on public.branches
  for select to anon, authenticated using (true);

drop policy if exists "Public can read items" on public.items;
create policy "Public can read items" on public.items
  for select to anon, authenticated using (true);

create index if not exists areas_city_id_idx on public.areas (city_id);
create index if not exists branches_restaurant_id_idx on public.branches (restaurant_id);
create index if not exists branches_area_id_idx on public.branches (area_id);
create index if not exists items_category_id_idx on public.items (category_id);
create index if not exists items_meal_type_idx on public.items (meal_type);
