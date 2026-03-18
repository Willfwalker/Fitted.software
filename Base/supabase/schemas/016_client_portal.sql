-- ============================================
-- 016: Client Portal
-- ============================================

CREATE TABLE IF NOT EXISTS client_portals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id  uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id  uuid REFERENCES companies(id) ON DELETE SET NULL,
  token       uuid NOT NULL DEFAULT gen_random_uuid(),
  enabled     boolean NOT NULL DEFAULT true,
  permissions jsonb NOT NULL DEFAULT '{"invoices": true, "projects": true, "files": true, "forms": true}',
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token)
);

ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_client_portals_updated_at
  BEFORE UPDATE ON client_portals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Org members can manage portals
CREATE POLICY client_portals_select ON client_portals
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY client_portals_insert ON client_portals
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY client_portals_update ON client_portals
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY client_portals_delete ON client_portals
  FOR DELETE USING (org_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_client_portals_token ON client_portals(token);
CREATE INDEX idx_client_portals_org ON client_portals(org_id);
CREATE INDEX idx_client_portals_contact ON client_portals(contact_id);
CREATE INDEX idx_client_portals_company ON client_portals(company_id);
