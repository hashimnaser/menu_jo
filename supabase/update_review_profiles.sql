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
where r.user_id = u.id;
