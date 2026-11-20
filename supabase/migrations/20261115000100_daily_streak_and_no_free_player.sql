-- Add Daily Login Streak tracking to profiles and ensure new accounts start with NO free player.

-- 1. Ensure new accounts start with an empty unlocked_characters array and no equipped character
alter table public.profiles
  alter column unlocked_characters set default array[]::text[],
  alter column equipped_character_id set default '';

-- 2. Add daily_streak and last_active_date columns to profiles
alter table public.profiles
  add column if not exists daily_streak integer not null default 0,
  add column if not exists last_active_date date;

-- 3. Ensure new user trigger explicitly starts with no player
create or replace function public.handle_new_kids_center_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname, role, unlocked_characters, equipped_character_id, daily_streak, last_active_date)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    'student',
    array[]::text[],
    '',
    1,
    current_date
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

-- 4. Remove any remaining free starter Lamine Yamal assignment on accounts that never earned enough coins to buy him (15,000)
update public.profiles
set
  unlocked_characters = array_remove(coalesce(unlocked_characters, array[]::text[]), 'yamal-19'),
  equipped_character_id = case
    when equipped_character_id = 'yamal-19' then
      coalesce((array_remove(coalesce(unlocked_characters, array[]::text[]), 'yamal-19'))[1], '')
    else equipped_character_id
  end
where (
  'yamal-19' = any(coalesce(unlocked_characters, array[]::text[]))
  or equipped_character_id = 'yamal-19'
)
and coalesce((stats->>'totalCoinsEarned')::integer, coins, 0) < 15000;

-- 5. RPC to touch/update the signed-in student's daily login streak atomically
create or replace function public.touch_daily_streak()
returns table (
  daily_streak integer,
  last_active_date date
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_prev_streak integer;
  v_prev_date date;
  v_next_streak integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select p.daily_streak, p.last_active_date
  into v_prev_streak, v_prev_date
  from public.profiles p
  where p.id = v_uid;

  if v_prev_date is null then
    v_next_streak := 1;
  elsif v_prev_date = current_date then
    v_next_streak := greatest(1, coalesce(v_prev_streak, 1));
  elsif v_prev_date = (current_date - 1) then
    v_next_streak := coalesce(v_prev_streak, 0) + 1;
  else
    -- Missed 1 or more days -> reset daily streak to 1 for today
    v_next_streak := 1;
  end if;

  update public.profiles
  set
    daily_streak = v_next_streak,
    last_active_date = current_date,
    stats = jsonb_set(
      jsonb_set(coalesce(stats, '{}'::jsonb), '{dailyStreak}', to_jsonb(v_next_streak), true),
      '{lastActiveDate}',
      to_jsonb(to_char(current_date, 'YYYY-MM-DD')),
      true
    ),
    updated_at = now()
  where id = v_uid;

  return query select v_next_streak, current_date;
end;
$$;

-- 6. Update public leaderboard RPC to return accurate unlocked_count (0 when empty) and active daily_streak
drop function if exists public.get_public_leaderboard();
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
  daily_streak integer,
  last_active_date date,
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
    coalesce(cardinality(p.unlocked_characters), 0)::integer,
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
    case
      when p.last_active_date is not null and p.last_active_date >= (current_date - 1)
        then greatest(1, coalesce(p.daily_streak, 0))
      else 0
    end,
    p.last_active_date,
    p.stats
  from public.profiles p
  where p.role = 'student'
  order by p.coins desc, p.nickname asc;
$$;

-- 7. Update teacher roster RPC to include daily_streak and accurate unlocked_count
drop function if exists public.teacher_get_roster(text);
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
  daily_streak integer,
  last_active_date date,
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
    coalesce(cardinality(p.unlocked_characters), 0)::integer,
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
    case
      when p.last_active_date is not null and p.last_active_date >= (current_date - 1)
        then greatest(1, coalesce(p.daily_streak, 0))
      else 0
    end,
    p.last_active_date,
    p.stats,
    p.updated_at
  from public.profiles p
  where p.role = 'student'
  order by p.coins desc, p.nickname asc;
end;
$$;

revoke all on function public.touch_daily_streak() from public;
grant execute on function public.touch_daily_streak() to authenticated;

revoke all on function public.get_public_leaderboard() from public;
grant execute on function public.get_public_leaderboard() to anon, authenticated;

revoke all on function public.teacher_get_roster(text) from public;
grant execute on function public.teacher_get_roster(text) to anon, authenticated;
