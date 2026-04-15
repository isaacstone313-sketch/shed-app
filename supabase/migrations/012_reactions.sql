create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  emoji      text not null check (emoji in ('🔥', '💪', '🎵', '⭐', '🐴')),
  created_at timestamptz not null default now(),
  unique (session_id, user_id)
);

alter table public.reactions enable row level security;

create policy "reactions_select"
  on public.reactions for select to authenticated using (true);

create policy "reactions_insert_own"
  on public.reactions for insert to authenticated with check (auth.uid() = user_id);

create policy "reactions_update_own"
  on public.reactions for update to authenticated using (auth.uid() = user_id);

create policy "reactions_delete_own"
  on public.reactions for delete to authenticated using (auth.uid() = user_id);
