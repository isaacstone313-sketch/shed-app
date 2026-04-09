create table push_subscriptions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  subscription  jsonb       not null,
  created_at    timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "Users can insert own push subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can select own push subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can delete own push subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);
