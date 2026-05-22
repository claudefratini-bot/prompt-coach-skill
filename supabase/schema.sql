-- =====================================================
-- HABIT ARENA — Schema, RLS, Triggers
-- Run this in the Supabase SQL editor of a fresh project.
-- Re-runnable: every CREATE is guarded by IF NOT EXISTS or DROP-then-CREATE.
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------- PROFILES ----------
create table if not exists profiles (
  id           uuid primary key references auth.users on delete cascade,
  username     text unique not null,
  display_name text,
  avatar_emoji text default '🦊',
  total_xp     int  default 0,
  level        int  default 1,
  created_at   timestamptz default now()
);

-- Auto-create a profile on auth.users insert.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_name text;
  uname text;
  n int := 0;
begin
  base_name := lower(regexp_replace(coalesce(split_part(new.email,'@',1),'player'), '[^a-z0-9_]', '', 'g'));
  if base_name = '' then base_name := 'player'; end if;
  uname := base_name;
  while exists (select 1 from profiles where username = uname) loop
    n := n + 1;
    uname := base_name || n::text;
  end loop;
  insert into profiles (id, username, display_name)
  values (new.id, uname, coalesce(new.raw_user_meta_data->>'display_name', uname));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- HABITS ----------
create table if not exists habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  title       text not null,
  emoji       text default '⚡',
  difficulty  text default 'medium' check (difficulty in ('easy','medium','hard')),
  frequency   text default 'daily'  check (frequency in ('daily','weekdays','weekly')),
  archived    boolean default false,
  created_at  timestamptz default now()
);
create index if not exists habits_user_idx on habits(user_id, archived);

-- ---------- GOALS ----------
create table if not exists goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  title        text not null,
  emoji        text default '🎯',
  target_date  date,
  xp_reward    int default 250 check (xp_reward between 1 and 5000),
  completed    boolean default false,
  completed_at timestamptz,
  created_at   timestamptz default now()
);
create index if not exists goals_user_idx on goals(user_id, completed);

-- ---------- COMPLETIONS ----------
create table if not exists completions (
  id           uuid primary key default gen_random_uuid(),
  habit_id     uuid not null references habits(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete cascade,
  photo_path   text not null,
  note         text,
  xp_earned    int  not null default 0,
  completed_at timestamptz default now(),
  day          date generated always as ((completed_at at time zone 'utc')::date) stored
);
create unique index if not exists completions_one_per_day on completions(habit_id, day);
create index if not exists completions_user_day_idx on completions(user_id, day desc);

-- ---------- FRIENDSHIPS ----------
create table if not exists friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  addressee_id  uuid not null references profiles(id) on delete cascade,
  status        text default 'pending' check (status in ('pending','accepted','blocked')),
  created_at    timestamptz default now(),
  unique(requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create or replace function are_friends(a uuid, b uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b)
        or (requester_id = b and addressee_id = a))
  );
$$;

-- ---------- REACTIONS ----------
create table if not exists reactions (
  id            uuid primary key default gen_random_uuid(),
  completion_id uuid not null references completions(id) on delete cascade,
  user_id       uuid not null references profiles(id) on delete cascade,
  emoji         text not null,
  created_at    timestamptz default now(),
  unique(completion_id, user_id, emoji)
);

-- ---------- CHALLENGES (1v1) ----------
create table if not exists challenges (
  id                     uuid primary key default gen_random_uuid(),
  challenger_id          uuid not null references profiles(id) on delete cascade,
  opponent_id            uuid not null references profiles(id) on delete cascade,
  title                  text not null,
  emoji                  text default '⚔️',
  duration_days          int  not null default 7 check (duration_days between 1 and 60),
  stake_xp               int  not null default 100 check (stake_xp between 10 and 5000),
  status                 text not null default 'pending' check (status in ('pending','active','completed','declined','cancelled')),
  winner_id              uuid references profiles(id),
  challenger_score       int  default 0,
  opponent_score         int  default 0,
  starts_at              timestamptz,
  ends_at                timestamptz,
  created_at             timestamptz default now(),
  check (challenger_id <> opponent_id)
);

-- ===== XP MATH =====
-- Cumulative XP for level L = 50 * L * (L - 1)
create or replace function level_from_xp(xp int) returns int
language sql immutable as $$
  select greatest(1, floor((1 + sqrt(1 + greatest(xp,0)::numeric / 12.5)) / 2))::int;
$$;

-- ===== TRIGGERS that derive XP authoritatively =====
-- COMPLETIONS: server-side computation of xp_earned based on habit difficulty + current streak.
create or replace function compute_completion_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  d text;
  base int;
  bonus int;
  streak_count int := 1;
  scan date;
begin
  select difficulty into d from habits where id = new.habit_id and user_id = new.user_id;
  if d is null then
    raise exception 'Habit not found or not yours';
  end if;
  base := case d when 'easy' then 5 when 'hard' then 25 else 12 end;

  -- Walk backwards from yesterday, counting consecutive days with completions.
  scan := current_date - 1;
  loop
    exit when not exists (
      select 1 from completions where habit_id = new.habit_id and day = scan
    );
    streak_count := streak_count + 1;
    scan := scan - 1;
  end loop;

  bonus := case
    when streak_count >= 100 then 100
    when streak_count >= 30 then 30
    when streak_count >= 7 then 10
    when streak_count >= 3 then 3
    else 0
  end;

  new.xp_earned := base + bonus;
  return new;
end $$;
drop trigger if exists trg_compute_completion_xp on completions;
create trigger trg_compute_completion_xp
  before insert on completions
  for each row execute function compute_completion_xp();

create or replace function award_completion_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update profiles
     set total_xp = total_xp + new.xp_earned,
         level    = level_from_xp(total_xp + new.xp_earned)
   where id = new.user_id;
  return new;
end $$;
drop trigger if exists trg_award_completion_xp on completions;
create trigger trg_award_completion_xp
  after insert on completions
  for each row execute function award_completion_xp();

-- GOALS: award xp_reward when transitioning to completed = true.
create or replace function award_goal_xp()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.completed and (old.completed is distinct from true) then
    if new.completed_at is null then
      new.completed_at := now();
    end if;
    update profiles
       set total_xp = total_xp + new.xp_reward,
           level    = level_from_xp(total_xp + new.xp_reward)
     where id = new.user_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_award_goal_xp on goals;
create trigger trg_award_goal_xp
  before update on goals
  for each row execute function award_goal_xp();

-- CHALLENGES: when status transitions to 'completed', recompute scores from
-- completions inside the window and transfer stake XP. Authoritative — client
-- cannot fake the winner.
create or replace function settle_challenge_xp()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c_score int; o_score int;
  winner uuid; loser uuid;
begin
  if new.status = 'completed' and (old.status is null or old.status <> 'completed') then
    if new.starts_at is null or new.ends_at is null then
      raise exception 'Cannot settle: battle has no time window';
    end if;
    if new.ends_at > now() then
      raise exception 'Cannot settle: battle has not ended yet';
    end if;

    select count(*) into c_score from completions
      where user_id = new.challenger_id
        and completed_at >= new.starts_at and completed_at < new.ends_at;
    select count(*) into o_score from completions
      where user_id = new.opponent_id
        and completed_at >= new.starts_at and completed_at < new.ends_at;

    new.challenger_score := c_score;
    new.opponent_score := o_score;
    if c_score = o_score then
      new.winner_id := null;
    elsif c_score > o_score then
      new.winner_id := new.challenger_id;
    else
      new.winner_id := new.opponent_id;
    end if;

    if new.winner_id is not null then
      winner := new.winner_id;
      loser := case when winner = new.challenger_id then new.opponent_id else new.challenger_id end;
      update profiles
         set total_xp = total_xp + new.stake_xp,
             level    = level_from_xp(total_xp + new.stake_xp)
       where id = winner;
      update profiles
         set total_xp = greatest(0, total_xp - new.stake_xp),
             level    = level_from_xp(greatest(0, total_xp - new.stake_xp))
       where id = loser;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_settle_challenge_xp on challenges;
create trigger trg_settle_challenge_xp
  before update on challenges
  for each row execute function settle_challenge_xp();

-- ===== ROW LEVEL SECURITY =====
alter table profiles    enable row level security;
alter table habits      enable row level security;
alter table goals       enable row level security;
alter table completions enable row level security;
alter table friendships enable row level security;
alter table reactions   enable row level security;
alter table challenges  enable row level security;

-- PROFILES: authenticated users can read profiles (for friend search & leaderboard);
-- users can update only their own. XP/level columns are protected by triggers that
-- only fire on completions/goals/challenges — but a malicious client could still UPDATE
-- the profile directly. We block that with a column-level restriction:
drop policy if exists "profiles read all" on profiles;
create policy "profiles read all" on profiles for select to authenticated using (true);

drop policy if exists "profiles update self" on profiles;
create policy "profiles update self" on profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

-- Prevent direct XP/level tampering: the `authenticated` role is only granted
-- UPDATE on safe columns. SECURITY DEFINER triggers run as the function owner
-- (postgres) and still update XP/level columns.
revoke update on profiles from authenticated;
grant update (username, display_name, avatar_emoji) on profiles to authenticated;

-- HABITS: owner-only.
drop policy if exists "habits owner all" on habits;
create policy "habits owner all" on habits
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- GOALS: owner writes; friends read.
drop policy if exists "goals owner write" on goals;
create policy "goals owner write" on goals
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals friends read" on goals;
create policy "goals friends read" on goals
  for select to authenticated
  using (auth.uid() = user_id or are_friends(auth.uid(), user_id));

-- COMPLETIONS: owner inserts; owner + friends read.
drop policy if exists "completions owner write" on completions;
create policy "completions owner write" on completions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "completions owner del" on completions;
create policy "completions owner del" on completions
  for delete to authenticated using (auth.uid() = user_id);
drop policy if exists "completions read" on completions;
create policy "completions read" on completions
  for select to authenticated
  using (auth.uid() = user_id or are_friends(auth.uid(), user_id));

-- FRIENDSHIPS.
drop policy if exists "friendships read" on friendships;
create policy "friendships read" on friendships
  for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
drop policy if exists "friendships insert" on friendships;
create policy "friendships insert" on friendships
  for insert to authenticated with check (auth.uid() = requester_id);
drop policy if exists "friendships update" on friendships;
create policy "friendships update" on friendships
  for update to authenticated
  using (auth.uid() in (requester_id, addressee_id))
  with check (auth.uid() in (requester_id, addressee_id));
drop policy if exists "friendships delete" on friendships;
create policy "friendships delete" on friendships
  for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- REACTIONS.
drop policy if exists "reactions read" on reactions;
create policy "reactions read" on reactions
  for select to authenticated using (
    exists (
      select 1 from completions c
       where c.id = completion_id
         and (c.user_id = auth.uid() or are_friends(auth.uid(), c.user_id))
    )
  );
drop policy if exists "reactions write" on reactions;
create policy "reactions write" on reactions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "reactions delete" on reactions;
create policy "reactions delete" on reactions
  for delete to authenticated using (auth.uid() = user_id);

-- CHALLENGES.
drop policy if exists "challenges read" on challenges;
create policy "challenges read" on challenges
  for select to authenticated
  using (auth.uid() in (challenger_id, opponent_id));
drop policy if exists "challenges insert" on challenges;
create policy "challenges insert" on challenges
  for insert to authenticated with check (auth.uid() = challenger_id);
drop policy if exists "challenges update" on challenges;
create policy "challenges update" on challenges
  for update to authenticated
  using (auth.uid() in (challenger_id, opponent_id))
  with check (auth.uid() in (challenger_id, opponent_id));

-- ===== STORAGE BUCKET =====
insert into storage.buckets (id, name, public)
values ('habit-photos', 'habit-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos upload own" on storage.objects;
create policy "photos upload own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'habit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "photos delete own" on storage.objects;
create policy "photos delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'habit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
