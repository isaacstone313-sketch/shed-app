-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);


-- Practice sessions
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  instrument text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  notes text not null default '',
  ai_feedback text,
  created_at timestamptz default now() not null
);

alter table public.sessions enable row level security;

create policy "Sessions viewable by authenticated users"
  on public.sessions for select to authenticated using (true);

create policy "Users can insert their own sessions"
  on public.sessions for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on public.sessions for update to authenticated using (auth.uid() = user_id);


-- Groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null
);

alter table public.groups enable row level security;

create policy "Groups viewable by authenticated users"
  on public.groups for select to authenticated using (true);

create policy "Authenticated users can create groups"
  on public.groups for insert to authenticated with check (auth.uid() = created_by);


-- Group memberships
create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now() not null,
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Group members viewable by authenticated users"
  on public.group_members for select to authenticated using (true);

create policy "Users can join groups"
  on public.group_members for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can leave groups"
  on public.group_members for delete to authenticated using (auth.uid() = user_id);
