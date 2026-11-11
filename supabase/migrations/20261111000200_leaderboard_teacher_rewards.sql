-- Secure server-side roster and teacher rewards.
-- The teacher access code is checked inside PostgreSQL; it is not shipped in the client bundle.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.teacher_access_codes (
  passcode_hash text primary key,
  created_at timestamptz not null default now()
);
alter table public.teacher_access_codes enable row level security;
revoke all on public.teacher_access_codes from anon, authenticated;

-- Preserve the two teacher passcodes supported by the previous app version.
insert into public.teacher_access_codes (passcode_hash)
values
  (extensions.crypt('01068545095', extensions.gen_salt('bf'))),
  (extensions.crypt('1234', extensions.gen_salt('bf')))
on conflict do nothing;

create or replace function public.get_public_leaderboard()
returns table (
  id uuid,
  nickname text,
  coins integer,
  equipped_character_id text,
  unlocked_count integer,
  total_solved integer,
  total_correct integer,
  accuracy integer,
  best_streak integer,
  stats jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.nickname,
    p.coins,
    p.equipped_character_id,
    coalesce(cardinality(p.unlocked_characters), 1)::integer,
    coalesce((p.stats->>'totalSolved')::integer, 0),
    coalesce((p.stats->>'totalCorrect')::integer, 0),
    case when coalesce((p.stats->>'totalSolved')::integer, 0) > 0
      then round(
        coalesce((p.stats->>'totalCorrect')::numeric, 0) * 100 /
        nullif((p.stats->>'totalSolved')::numeric, 0)
      )::integer
      else 100
    end,
    coalesce((p.stats->>'bestStreak')::integer, 0),
    p.stats
  from public.profiles p
  where p.role = 'student'
  order by p.coins desc, p.nickname asc;
$$;

create or replace function public.teacher_get_roster(p_passcode text)
returns table (
  id uuid,
  email text,
  nickname text,
  coins integer,
  equipped_character_id text,
  unlocked_count integer,
  total_solved integer,
  total_correct integer,
  accuracy integer,
  best_streak integer,
  stats jsonb,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
begin
  if not exists (
    select 1 from public.teacher_access_codes c
    where extensions.crypt(coalesce(p_passcode, ''), c.passcode_hash) = c.passcode_hash
  ) then
    raise exception 'Invalid teacher passcode';
  end if;

  return query
  select
    p.id,
    p.email,
    p.nickname,
    p.coins,
    p.equipped_character_id,
    coalesce(cardinality(p.unlocked_characters), 1)::integer,
    coalesce((p.stats->>'totalSolved')::integer, 0),
    coalesce((p.stats->>'totalCorrect')::integer, 0),
    case when coalesce((p.stats->>'totalSolved')::integer, 0) > 0
      then round(
        coalesce((p.stats->>'totalCorrect')::numeric, 0) * 100 /
        nullif((p.stats->>'totalSolved')::numeric, 0)
      )::integer
      else 100
    end,
    coalesce((p.stats->>'bestStreak')::integer, 0),
    p.stats,
    p.updated_at
  from public.profiles p
  where p.role = 'student'
  order by p.coins desc, p.nickname asc;
end;
$$;

create or replace function public.teacher_award_coins(
  p_passcode text,
  p_student_id uuid,
  p_amount integer default 100
)
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_balance integer;
begin
  if not exists (
    select 1 from public.teacher_access_codes c
    where extensions.crypt(coalesce(p_passcode, ''), c.passcode_hash) = c.passcode_hash
  ) then
    raise exception 'Invalid teacher passcode';
  end if;

  if p_amount is null or p_amount < 1 or p_amount > 10000 then
    raise exception 'Reward amount must be between 1 and 10000';
  end if;

  update public.profiles
  set coins = coins + p_amount,
      stats = jsonb_set(
        coalesce(stats, '{}'::jsonb),
        '{totalCoinsEarned}',
        to_jsonb(coalesce((stats->>'totalCoinsEarned')::integer, 0) + p_amount),
        true
      ),
      updated_at = now()
  where id = p_student_id and role = 'student'
  returning coins into new_balance;

  if new_balance is null then
    raise exception 'Student profile not found';
  end if;

  return new_balance;
end;
$$;

revoke all on function public.get_public_leaderboard() from public;
revoke all on function public.teacher_get_roster(text) from public;
revoke all on function public.teacher_award_coins(text, uuid, integer) from public;
grant execute on function public.get_public_leaderboard() to anon, authenticated;
grant execute on function public.teacher_get_roster(text) to anon, authenticated;
grant execute on function public.teacher_award_coins(text, uuid, integer) to anon, authenticated;
