-- ============================================
-- 014: Time Tracking
-- ============================================

-- Add TIME_LOGGED to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'TIME_LOGGED';

CREATE TABLE IF NOT EXISTS time_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id         uuid REFERENCES tasks(id) ON DELETE SET NULL,
  deal_id         uuid REFERENCES deals(id) ON DELETE SET NULL,
  contact_id      uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id      uuid REFERENCES companies(id) ON DELETE SET NULL,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description     text,
  duration_minutes integer NOT NULL DEFAULT 0,
  date            date NOT NULL DEFAULT CURRENT_DATE,
  billable        boolean NOT NULL DEFAULT true,
  rate            numeric(12,2) DEFAULT 0,
  invoice_id      uuid REFERENCES invoices(id) ON DELETE SET NULL,
  timer_started_at timestamptz,
  timer_paused_at  timestamptz,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE POLICY time_entries_select ON time_entries
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY time_entries_insert ON time_entries
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY time_entries_update ON time_entries
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY time_entries_delete ON time_entries
  FOR DELETE USING (org_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_time_entries_org ON time_entries(org_id);
CREATE INDEX idx_time_entries_task ON time_entries(task_id);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_invoice ON time_entries(invoice_id);
