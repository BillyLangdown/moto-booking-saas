-- APNs device tokens for push notifications
-- One row per (user, device) pair so admins with multiple devices all get notified

CREATE TABLE IF NOT EXISTS device_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  uuid        NOT NULL,
  token      text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own tokens
CREATE POLICY "own device tokens"
  ON device_tokens FOR ALL
  USING (user_id = auth.uid());

-- Service role can read all tokens (used by push notification sender)
CREATE POLICY "service role read"
  ON device_tokens FOR SELECT
  USING (auth.role() = 'service_role');

-- Index for fast lookup by tenant when sending push notifications
CREATE INDEX IF NOT EXISTS device_tokens_tenant_id_idx ON device_tokens (tenant_id);
