alter table public.restaurants
  add column if not exists service_types text[] not null
    default array['dine_in', 'takeaway', 'delivery']::text[],
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists tiktok_url text,
  add column if not exists price_level smallint;

update public.restaurants
set service_types = array['dine_in', 'takeaway', 'delivery']::text[]
where service_types is null
   or (slug in ('zakho', 'shawarmaji-hashemi') and cardinality(service_types) = 0);

alter table public.restaurants
  alter column service_types set default array['dine_in', 'takeaway', 'delivery']::text[],
  alter column service_types set not null;

alter table public.restaurants
  drop constraint if exists restaurants_service_types_check,
  drop constraint if exists restaurants_price_level_check;

alter table public.restaurants
  add constraint restaurants_service_types_check
    check (service_types <@ array['dine_in', 'takeaway', 'delivery']::text[]),
  add constraint restaurants_price_level_check
    check (price_level is null or price_level between 1 and 3);

update public.restaurants
set price_level = coalesce(price_level, 1)
where slug in ('zakho', 'shawarmaji-hashemi');

grant select on public.restaurants to anon, authenticated;

notify pgrst, 'reload schema';
