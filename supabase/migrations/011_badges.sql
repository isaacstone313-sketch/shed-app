-- badges: master list (seeded, immutable by users)
create table badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null,
  category    text not null check (category in ('time', 'streak', 'social', 'sessions')),
  emoji       text not null,
  threshold   integer not null,  -- meaning varies by category (minutes for time, days for streak, count for others)
  created_at  timestamptz not null default now()
);

-- user_badges: which badges each user has earned
create table user_badges (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references auth.users(id) on delete cascade,
  badge_id  uuid not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table badges      enable row level security;
alter table user_badges enable row level security;

-- Anyone can read the badge definitions
create policy "badges_read_all"
  on badges for select using (true);

-- Users can read / insert their own earned badges
create policy "user_badges_select_own"
  on user_badges for select using (auth.uid() = user_id);

create policy "user_badges_insert_own"
  on user_badges for insert with check (auth.uid() = user_id);

-- ── Seed ─────────────────────────────────────────────────────────────────────

insert into badges (slug, name, description, category, emoji, threshold) values
  -- Time (threshold = total minutes)
  ('first-hour',        'First Hour',    'Log 1 hour of total practice time',    'time',     '⏱️',  60),
  ('ten-hours',         'Ten Hours',     'Log 10 hours of total practice time',  'time',     '🕙',  600),
  ('fifty-hours',       'Fifty Hours',   'Log 50 hours of total practice time',  'time',     '🔥',  3000),
  ('century',           'Century',       'Log 100 hours of total practice time', 'time',     '💯',  6000),

  -- Streak (threshold = consecutive days)
  ('three-day',         'On a Roll',     'Practice 3 days in a row',             'streak',   '📅',  3),
  ('week-warrior',      'Week Warrior',  'Practice 7 days in a row',             'streak',   '⚡',  7),
  ('fortnight',         'Fortnight',     'Practice 14 days in a row',            'streak',   '🗓️', 14),

  -- Social (threshold = count; first-comment uses comment count, others use follow count)
  ('first-follow',      'Connected',     'Follow your first musician',           'social',   '🤝',  1),
  ('five-follows',      'Social',        'Follow 5 musicians',                   'social',   '👥',  5),
  ('ten-follows',       'Community',     'Follow 10 musicians',                  'social',   '🌐',  10),
  ('first-comment',     'Commentator',   'Leave your first comment',             'social',   '💬',  1),

  -- Sessions (threshold = session count)
  ('first-session',     'First Steps',   'Log your very first session',          'sessions', '🎵',  1),
  ('ten-sessions',      'Dedicated',     'Log 10 practice sessions',             'sessions', '🎯',  10),
  ('fifty-sessions',    'Committed',     'Log 50 practice sessions',             'sessions', '🏅',  50),
  ('century-sessions',  'Legend',        'Log 100 practice sessions',            'sessions', '🏆',  100);
