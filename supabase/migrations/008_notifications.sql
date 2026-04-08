-- ── Notifications table ───────────────────────────────────────────────────────
-- user_id / actor_id reference profiles(id) so PostgREST can resolve the join.
-- profiles.id = auth.users.id (1-1), so the UUID values are identical.

CREATE TABLE IF NOT EXISTS notifications (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type        text NOT NULL CHECK (type IN ('follow', 'kudo', 'comment', 'reply')),
  session_id  uuid REFERENCES sessions(id) ON DELETE CASCADE,
  comment_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  read        boolean DEFAULT false NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications"   ON notifications;
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- SECURITY DEFINER trigger functions run as superuser and bypass RLS,
-- but this policy guards against any other insert path.
DROP POLICY IF EXISTS "Service can insert notifications"   ON notifications;
CREATE POLICY "Service can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications (created_at DESC);

-- ── Trigger: follow ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.follower_id = NEW.following_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, actor_id, type)
  VALUES (NEW.following_id, NEW.follower_id, 'follow');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_follow ON follows;
CREATE TRIGGER trg_notify_follow
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- ── Trigger: kudo ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_on_kudo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM sessions WHERE id = NEW.session_id;
  IF v_owner IS NULL OR v_owner = NEW.user_id THEN RETURN NEW; END IF;
  INSERT INTO notifications (user_id, actor_id, type, session_id)
  VALUES (v_owner, NEW.user_id, 'kudo', NEW.session_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_kudo ON kudos;
CREATE TRIGGER trg_notify_kudo
  AFTER INSERT ON kudos
  FOR EACH ROW EXECUTE FUNCTION notify_on_kudo();

-- ── Trigger: comment / reply ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_owner  uuid;
  v_parent_owner   uuid;
BEGIN
  IF NEW.parent_comment_id IS NULL THEN
    -- Top-level comment: notify session owner
    SELECT user_id INTO v_session_owner FROM sessions WHERE id = NEW.session_id;
    IF v_session_owner IS NOT NULL AND v_session_owner <> NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, session_id, comment_id)
      VALUES (v_session_owner, NEW.user_id, 'comment', NEW.session_id, NEW.id);
    END IF;
  ELSE
    -- Reply: notify parent comment owner
    SELECT user_id INTO v_parent_owner FROM comments WHERE id = NEW.parent_comment_id;
    IF v_parent_owner IS NOT NULL AND v_parent_owner <> NEW.user_id THEN
      INSERT INTO notifications (user_id, actor_id, type, session_id, comment_id)
      VALUES (v_parent_owner, NEW.user_id, 'reply', NEW.session_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_comment ON comments;
CREATE TRIGGER trg_notify_comment
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION notify_on_comment();
