-- ── Session shoutouts (co-session tagging) ───────────────────────────────────

create table public.session_shoutouts (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.sessions(id) on delete cascade,
  tagged_user_id     uuid not null references public.profiles(id) on delete cascade,
  tagged_by_user_id  uuid not null references public.profiles(id) on delete cascade,
  status             text not null default 'pending'
                       check (status in ('pending', 'accepted', 'declined')),
  expires_at         timestamptz not null,  -- always created_at + 24 hours
  created_at         timestamptz not null default now()
);

alter table public.session_shoutouts enable row level security;

-- Read: involved parties only (tagger, tagged user)
create policy "shoutouts_select"
  on public.session_shoutouts for select to authenticated
  using (auth.uid() = tagged_user_id or auth.uid() = tagged_by_user_id);

-- Insert: only the person doing the tagging
create policy "shoutouts_insert"
  on public.session_shoutouts for insert to authenticated
  with check (auth.uid() = tagged_by_user_id);

-- Update: only the tagged user (to accept / decline)
create policy "shoutouts_update"
  on public.session_shoutouts for update to authenticated
  using (auth.uid() = tagged_user_id);

create index session_shoutouts_session_id_idx    on public.session_shoutouts (session_id);
create index session_shoutouts_tagged_user_id_idx on public.session_shoutouts (tagged_user_id);

-- ── Add shoutout_id to sessions ───────────────────────────────────────────────
-- When a tagged user accepts, a new session row is created for them and
-- shoutout_id links it back to the shoutout that spawned it.

alter table public.sessions
  add column shoutout_id uuid references public.session_shoutouts(id) on delete set null;
