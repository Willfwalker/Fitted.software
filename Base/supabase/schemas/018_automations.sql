-- ============================================
-- 018: Workflow Automations
-- ============================================

CREATE TABLE IF NOT EXISTS automations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  trigger_type    text NOT NULL,
  trigger_config  jsonb NOT NULL DEFAULT '{}',
  action_type     text NOT NULL,
  action_config   jsonb NOT NULL DEFAULT '{}',
  enabled         boolean NOT NULL DEFAULT true,
  last_run_at     timestamptz,
  run_count       integer NOT NULL DEFAULT 0,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id   uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_data    jsonb,
  action_result   jsonb,
  status          text NOT NULL DEFAULT 'SUCCESS',  -- SUCCESS | FAILED
  error_message   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Automations policies
CREATE POLICY automations_select ON automations
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY automations_insert ON automations
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY automations_update ON automations
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY automations_delete ON automations
  FOR DELETE USING (org_id IN (SELECT get_user_org_ids()));

-- Automation logs policies
CREATE POLICY automation_logs_select ON automation_logs
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY automation_logs_insert ON automation_logs
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_automations_org ON automations(org_id);
CREATE INDEX idx_automations_trigger ON automations(trigger_type);
CREATE INDEX idx_automations_enabled ON automations(enabled);
CREATE INDEX idx_automation_logs_automation ON automation_logs(automation_id);
CREATE INDEX idx_automation_logs_org ON automation_logs(org_id);
