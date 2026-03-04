-- ============================================
-- 009: Messaging & Templates
-- ============================================

-- Enums
CREATE TYPE message_channel AS ENUM ('EMAIL', 'SMS');
CREATE TYPE message_status AS ENUM ('DRAFT', 'SENT', 'DELIVERED', 'FAILED');

-- Message templates
CREATE TABLE message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text,
  body text NOT NULL DEFAULT '',
  channel message_channel NOT NULL DEFAULT 'EMAIL',
  variables jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Messages (send log)
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel message_channel NOT NULL DEFAULT 'EMAIL',
  status message_status NOT NULL DEFAULT 'DRAFT',
  subject text,
  body text NOT NULL DEFAULT '',
  recipient_email text,
  recipient_name text,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  template_id uuid REFERENCES message_templates(id) ON DELETE SET NULL,
  sent_at timestamptz,
  error_message text,
  metadata jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Activity type extension
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'MESSAGE_SENT';

-- Indexes
CREATE INDEX idx_message_templates_org ON message_templates(org_id);
CREATE INDEX idx_messages_org ON messages(org_id);
CREATE INDEX idx_messages_status ON messages(org_id, status);
CREATE INDEX idx_messages_contact ON messages(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX idx_messages_company ON messages(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX idx_messages_deal ON messages(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX idx_messages_template ON messages(template_id) WHERE template_id IS NOT NULL;
CREATE INDEX idx_messages_sent_at ON messages(org_id, sent_at DESC) WHERE sent_at IS NOT NULL;

-- Updated_at triggers
CREATE TRIGGER set_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- message_templates policies
CREATE POLICY "message_templates_select" ON message_templates
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "message_templates_insert" ON message_templates
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "message_templates_update" ON message_templates
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "message_templates_delete" ON message_templates
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- messages policies
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "messages_delete" ON messages
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );
