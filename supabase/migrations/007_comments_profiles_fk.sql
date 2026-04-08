-- Add an explicit FK from comments.user_id → profiles.id so PostgREST
-- can resolve the profiles join when querying comments.
ALTER TABLE comments
  ADD CONSTRAINT comments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
