-- ============================================
-- 013: Integrations (OAuth/API key storage)
-- ============================================

CREATE TABLE IF NOT EXISTS integrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider    text NOT NULL,  -- e.g. 'google_calendar', 'stripe'
  access_token  text,
  refresh_token text,
  token_expiry  timestamptz,
  config      jsonb DEFAULT '{}',
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id, provider)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Users can manage their own integrations within their org
CREATE POLICY integrations_select ON integrations
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY integrations_insert ON integrations
  FOR INSERT WITH CHECK (
    org_id IN (SELECT get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY integrations_update ON integrations
  FOR UPDATE USING (
    org_id IN (SELECT get_user_org_ids())
    AND user_id = auth.uid()
  );

CREATE POLICY integrations_delete ON integrations
  FOR DELETE USING (
    org_id IN (SELECT get_user_org_ids())
    AND user_id = auth.uid()
  );
