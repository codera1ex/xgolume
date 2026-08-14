-- Run this in Supabase Dashboard -> SQL Editor (once, on a fresh project)
-- Stores each user's GoLumo profile + saved trips, one row per user for
-- profile and one row per trip. Data is stored as JSONB so it matches the
-- existing app types exactly without needing a rigid column-per-field schema.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips(user_id);

-- Row Level Security: every user can only read/write their own rows.
alter table public.profiles enable row level security;
alter table public.trips enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: upsert own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

create policy "trips: read own" on public.trips
  for select using (auth.uid() = user_id);
create policy "trips: insert own" on public.trips
  for insert with check (auth.uid() = user_id);
create policy "trips: update own" on public.trips
  for update using (auth.uid() = user_id);
create policy "trips: delete own" on public.trips
  for delete using (auth.uid() = user_id);
