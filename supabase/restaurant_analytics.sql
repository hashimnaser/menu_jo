create table if not exists public.restaurant_analytics (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  event_type text not null check (event_type in ('call', 'whatsapp', 'share', 'page_view')),
  created_at timestamptz not null default now()
);

alter table public.restaurant_analytics enable row level security;

grant insert on public.restaurant_analytics to anon, authenticated;
revoke select, update, delete on public.restaurant_analytics from anon, authenticated;

drop policy if exists "Public can record restaurant analytics" on public.restaurant_analytics;
create policy "Public can record restaurant analytics"
  on public.restaurant_analytics for insert to anon, authenticated
  with check (true);
