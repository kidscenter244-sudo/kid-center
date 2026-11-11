-- Kids Center Pro Games: student account and progress storage
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nickname text not null default 'Math Champion',
  role text not null default 'student' check (role in ('student', 'teacher')),
  coins integer not null default 450,
  unlocked_characters text[] not null default array['yamal-19']::text[],
  equipped_character_id text not null default 'yamal-19',
  stats jsonb not null default '{"totalSolved":0,"totalCorrect":0,"totalCoinsEarned":450,"bestStreak":0}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
drop policy if exists "Players can read own profile" on public.profiles;
create policy "Players can read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "Players can insert own profile" on public.profiles;
create policy "Players can insert own profile" on public.profiles for insert to authenticated with check (auth.uid() = id);
drop policy if exists "Players can update own profile" on public.profiles;
create policy "Players can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_kids_center_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, nickname, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)), 'student')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_kids_center on auth.users;
create trigger on_auth_user_created_kids_center
after insert on auth.users
for each row execute procedure public.handle_new_kids_center_user();

grant select, insert, update on public.profiles to authenticated;
