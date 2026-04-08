-- Add mood and photo_url to sessions
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS mood text;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS photo_url text;

-- ── Storage bucket ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-photos', 'session-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload own session photos" ON storage.objects;
CREATE POLICY "Users can upload own session photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'session-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Anyone can view session photos" ON storage.objects;
CREATE POLICY "Anyone can view session photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'session-photos');

DROP POLICY IF EXISTS "Users can delete own session photos" ON storage.objects;
CREATE POLICY "Users can delete own session photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'session-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── Comments table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id         uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  body               text NOT NULL CHECK (char_length(body) >= 1 AND char_length(body) <= 1000),
  created_at         timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read comments" ON comments;
CREATE POLICY "Authenticated users can read comments" ON comments
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own comments" ON comments;
CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS comments_session_id_idx ON comments (session_id);
CREATE INDEX IF NOT EXISTS comments_parent_id_idx  ON comments (parent_comment_id);
