-- ============================================
-- 010: Forms & Data Capture
-- ============================================

-- Enums
CREATE TYPE form_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE form_field_type AS ENUM (
  'TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'DATE',
  'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'FILE', 'HIDDEN'
);

-- Activity type extension
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'FORM_SUBMITTED';

-- ============================================
-- Forms
-- ============================================
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  slug text,
  status form_status NOT NULL DEFAULT 'DRAFT',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  share_token uuid DEFAULT gen_random_uuid(),
  submission_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,

  CONSTRAINT forms_slug_org_unique UNIQUE (org_id, slug)
);

CREATE INDEX idx_forms_org ON forms(org_id);
CREATE INDEX idx_forms_status ON forms(org_id, status);
CREATE INDEX idx_forms_share_token ON forms(share_token);
CREATE INDEX idx_forms_created ON forms(org_id, created_at DESC);

CREATE TRIGGER set_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view forms in their org" ON forms
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create forms in their org" ON forms
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can update forms in their org" ON forms
  FOR UPDATE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete forms in their org" ON forms
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Public access via share_token (for public form rendering)
CREATE POLICY "Public can view active forms by share_token" ON forms
  FOR SELECT USING (
    status = 'ACTIVE' AND share_token IS NOT NULL
  );

-- ============================================
-- Form Submissions
-- ============================================
CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  source_ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX idx_form_submissions_org ON form_submissions(org_id);
CREATE INDEX idx_form_submissions_created ON form_submissions(form_id, created_at DESC);
CREATE INDEX idx_form_submissions_contact ON form_submissions(contact_id) WHERE contact_id IS NOT NULL;

-- RLS
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view submissions in their org" ON form_submissions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can delete submissions in their org" ON form_submissions
  FOR DELETE USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Public insert (for form submissions via API)
CREATE POLICY "Anyone can submit to forms" ON form_submissions
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Function: Increment submission count
-- ============================================
CREATE OR REPLACE FUNCTION increment_form_submission_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE forms SET submission_count = submission_count + 1 WHERE id = NEW.form_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_submission_count
  AFTER INSERT ON form_submissions
  FOR EACH ROW EXECUTE FUNCTION increment_form_submission_count();
