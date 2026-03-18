-- ============================================
-- 015: Stripe Payment Processing
-- ============================================

-- Add PAYMENT_RECEIVED to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'PAYMENT_RECEIVED';

-- Add Stripe columns to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_url text;

-- Stripe customer mapping
CREATE TABLE IF NOT EXISTS stripe_customers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id  uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id  uuid REFERENCES companies(id) ON DELETE SET NULL,
  stripe_customer_id text NOT NULL,
  email       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, stripe_customer_id)
);

ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE POLICY stripe_customers_select ON stripe_customers
  FOR SELECT USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY stripe_customers_insert ON stripe_customers
  FOR INSERT WITH CHECK (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY stripe_customers_update ON stripe_customers
  FOR UPDATE USING (org_id IN (SELECT get_user_org_ids()));

CREATE POLICY stripe_customers_delete ON stripe_customers
  FOR DELETE USING (org_id IN (SELECT get_user_org_ids()));

CREATE INDEX idx_stripe_customers_org ON stripe_customers(org_id);
CREATE INDEX idx_stripe_customers_contact ON stripe_customers(contact_id);
CREATE INDEX idx_stripe_customers_company ON stripe_customers(company_id);
