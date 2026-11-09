-- English Intuition: database setup.
-- Paste all of this into Supabase → SQL Editor → New query, then click Run.
-- Safe to run more than once.

-- 1. Each person's words. Row Level Security means people can only ever see and change their own rows.
create table if not exists public.entries (
  user_id   uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id        text        not null,
  data      jsonb,
  updated   bigint      not null default 0,
  deleted   boolean     not null default false,
  synced_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.entries enable row level security;

drop policy if exists "Own words only" on public.entries;
create policy "Own words only" on public.entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- synced_at is set by the server on every write, so devices can ask "what changed since I last looked?"
create or replace function public.entries_touch() returns trigger
language plpgsql as $$
begin
  new.synced_at := clock_timestamp();
  return new;
end $$;
drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before insert or update on public.entries
  for each row execute function public.entries_touch();
create index if not exists entries_user_synced on public.entries (user_id, synced_at);
grant select, insert, update, delete on public.entries to authenticated;

-- 2. Daily AI look-up counter, so the shared Gemini key isn't used up by one person.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  day     date not null default current_date,
  count   int  not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
drop policy if exists "Read own usage" on public.ai_usage;
create policy "Read own usage" on public.ai_usage
  for select to authenticated using (auth.uid() = user_id);
grant select on public.ai_usage to authenticated;

-- Called only by the AI function (with the server key). Returns the new count, or -1 when over the limit.
create or replace function public.bump_ai_usage(p_user uuid, p_limit int) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into ai_usage (user_id, day, count) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = ai_usage.count + 1
  returning count into n;
  if n > p_limit then return -1; end if;
  return n;
end $$;
revoke all on function public.bump_ai_usage(uuid, int) from public, anon, authenticated;
