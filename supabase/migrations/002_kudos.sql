create table if not exists public.kudos (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(session_id, user_id)
);

alter table public.kudos enable row level security;

drop policy if exists "Kudos viewable by authenticated users" on public.kudos;
create policy "Kudos viewable by authenticated users"
  on public.kudos for select to authenticated using (true);

drop policy if exists "Users can give kudos" on public.kudos;
create policy "Users can give kudos"
  on public.kudos for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own kudos" on public.kudos;
create policy "Users can remove their own kudos"
  on public.kudos for delete to authenticated using (auth.uid() = user_id);
