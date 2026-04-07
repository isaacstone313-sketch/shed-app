-- Public aggregate stats for the landing page — callable with anon key
-- security definer bypasses RLS so we can count without exposing rows

create or replace function public.get_public_stats()
returns json
language sql
security definer
stable
as $$
  select json_build_object(
    'sessions',  (select count(*)::int            from public.sessions),
    'minutes',   (select coalesce(sum(duration_minutes), 0)::int from public.sessions),
    'musicians', (select count(*)::int            from public.profiles)
  );
$$;

grant execute on function public.get_public_stats() to anon;
