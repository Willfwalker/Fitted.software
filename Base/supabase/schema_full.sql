-- ============================================
-- Fitted Agency — FULL Database Schema
-- Single file for provisioning. Run on a fresh Supabase project.
-- ============================================

-- ============================================
-- Enums
-- ============================================

CREATE TYPE public.app_role AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE public.deal_stage AS ENUM ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
CREATE TYPE public.deal_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE public.activity_type AS ENUM (
  'NOTE', 'EMAIL', 'CALL', 'MEETING',
  'DEAL_CREATED', 'DEAL_STAGE_CHANGED',
  'CONTACT_CREATED', 'COMPANY_CREATED',
  'INVOICE_CREATED', 'INVOICE_STATUS_CHANGED',
  'INVOICE_SENT', 'INVOICE_RECURRING_CREATED',
  'TASK_CREATED', 'TASK_STATUS_CHANGED', 'TASK_ASSIGNED',
  'FILE_UPLOADED',
  'EVENT_CREATED', 'EVENT_COMPLETED',
  'MESSAGE_SENT',
  'FORM_SUBMITTED'
);
CREATE TYPE public.invoice_status AS ENUM ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');
CREATE TYPE public.task_priority AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE public.task_status AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');
CREATE TYPE public.notification_status AS ENUM ('UNREAD', 'READ', 'ARCHIVED');
CREATE TYPE public.event_status AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE public.message_channel AS ENUM ('EMAIL', 'SMS');
CREATE TYPE public.message_status AS ENUM ('DRAFT', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE public.form_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE public.form_field_type AS ENUM (
  'TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'DATE',
  'SELECT', 'MULTI_SELECT', 'CHECKBOX', 'RADIO', 'FILE', 'HIDDEN'
);
CREATE TYPE public.chat_role AS ENUM ('user', 'assistant', 'status');
CREATE TYPE public.chat_job_status AS ENUM ('pending', 'running', 'complete', 'rejected', 'failed');

-- ============================================
-- Updated-at trigger function
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); RETURN new; END; $$;

-- ============================================
-- Organizations
-- ============================================

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled_modules jsonb NOT NULL DEFAULT '["crm","tasks","calendar","invoicing","messaging","files","forms","reports"]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'MEMBER',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);

CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(org_id);
CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);

-- ============================================
-- Helper functions (RLS, no recursion)
-- Must be after organization_members table
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$ SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() $$;

CREATE OR REPLACE FUNCTION public.get_user_admin_org_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER STABLE SET search_path = ''
AS $$ SELECT org_id FROM public.organization_members WHERE user_id = auth.uid() AND role IN ('OWNER', 'ADMIN') $$;

-- Invite codes
CREATE TABLE public.invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamptz,
  max_uses int NOT NULL DEFAULT 25,
  use_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_org ON public.invite_codes(org_id);

-- ============================================
-- Helper: check if any org exists (used by proxy)
-- ============================================

CREATE OR REPLACE FUNCTION public.org_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.organizations LIMIT 1);
$$;

-- ============================================
-- CRM: Companies, Contacts, Deals, Activities
-- ============================================

CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, domain text, industry text, phone text, email text, address text, notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_companies_org ON public.companies(org_id);
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name text NOT NULL, last_name text NOT NULL, email text, phone text, title text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_contacts_org ON public.contacts(org_id);
CREATE INDEX idx_contacts_company ON public.contacts(company_id);
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL, value numeric(12,2),
  stage public.deal_stage NOT NULL DEFAULT 'LEAD',
  priority public.deal_priority NOT NULL DEFAULT 'MEDIUM',
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  expected_close_date date, closed_at timestamptz,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0, notes text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_deals_org ON public.deals(org_id);
CREATE INDEX idx_deals_stage_position ON public.deals(org_id, stage, position);
CREATE INDEX idx_deals_contact ON public.deals(contact_id);
CREATE INDEX idx_deals_company ON public.deals(company_id);
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  type public.activity_type NOT NULL, title text NOT NULL, content text, metadata jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activities_org ON public.activities(org_id);
CREATE INDEX idx_activities_contact ON public.activities(contact_id);
CREATE INDEX idx_activities_deal ON public.activities(deal_id);
CREATE INDEX idx_activities_company ON public.activities(company_id);

-- ============================================
-- Invoicing + Tags
-- ============================================

CREATE TABLE public.invoice_sequences (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  next_num integer NOT NULL DEFAULT 1
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status public.invoice_status NOT NULL DEFAULT 'DRAFT',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  due_date date, paid_at timestamptz, notes text,
  share_token uuid DEFAULT NULL UNIQUE,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  discount_type text CHECK (discount_type IN ('percentage', 'flat')) DEFAULT NULL,
  discount_value numeric(12,2) DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  payment_terms text DEFAULT 'DUE_ON_RECEIPT',
  currency text NOT NULL DEFAULT 'USD',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_invoices_org ON public.invoices(org_id);
CREATE INDEX idx_invoices_status ON public.invoices(org_id, status);
CREATE INDEX idx_invoices_deal ON public.invoices(deal_id);
CREATE INDEX idx_invoices_contact ON public.invoices(contact_id);
CREATE INDEX idx_invoices_company ON public.invoices(company_id);
CREATE INDEX idx_invoices_share_token ON public.invoices(share_token) WHERE share_token IS NOT NULL;
CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.next_invoice_number(p_org_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_num integer;
BEGIN
  INSERT INTO public.invoice_sequences (org_id, next_num) VALUES (p_org_id, 2)
  ON CONFLICT (org_id) DO UPDATE SET next_num = public.invoice_sequences.next_num + 1
  RETURNING next_num - 1 INTO v_num;
  RETURN 'INV-' || lpad(v_num::text, 4, '0');
END; $$;

-- Recurring invoices
CREATE TABLE public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','YEARLY')),
  next_run_date date NOT NULL, end_date date DEFAULT NULL,
  runs_count integer NOT NULL DEFAULT 0, max_runs integer DEFAULT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','COMPLETED')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_recurring_invoices_org ON public.recurring_invoices(org_id);
CREATE INDEX idx_recurring_invoices_status_date ON public.recurring_invoices(status, next_run_date) WHERE status = 'ACTIVE';
CREATE TRIGGER recurring_invoices_updated_at BEFORE UPDATE ON public.recurring_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Tags
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, color text NOT NULL DEFAULT '#8A817A',
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, name)
);
CREATE INDEX idx_tags_org ON public.tags(org_id);

CREATE TABLE public.entity_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id uuid NOT NULL,
  UNIQUE(tag_id, entity_type, entity_id)
);
CREATE INDEX idx_entity_tags_entity ON public.entity_tags(entity_type, entity_id);
CREATE INDEX idx_entity_tags_tag ON public.entity_tags(tag_id);

-- ============================================
-- Tasks / Kanban
-- ============================================

CREATE TABLE public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, description text, archived boolean NOT NULL DEFAULT false, metadata jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_boards_org ON public.boards(org_id);
CREATE TRIGGER boards_updated_at BEFORE UPDATE ON public.boards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.board_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name text NOT NULL, position integer NOT NULL DEFAULT 0, wip_limit integer, color text, metadata jsonb,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_board_columns_board ON public.board_columns(board_id);
CREATE INDEX idx_board_columns_position ON public.board_columns(board_id, position);
CREATE TRIGGER board_columns_updated_at BEFORE UPDATE ON public.board_columns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, color text NOT NULL DEFAULT '#8A817A',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_labels_org ON public.labels(org_id);

CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.board_columns(id) ON DELETE CASCADE,
  title text NOT NULL, description text,
  priority public.task_priority NOT NULL DEFAULT 'NONE',
  status public.task_status NOT NULL DEFAULT 'TODO',
  due_date date,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0, metadata jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_tasks_org ON public.tasks(org_id);
CREATE INDEX idx_tasks_board ON public.tasks(board_id);
CREATE INDEX idx_tasks_column_position ON public.tasks(column_id, position);
CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  label_id uuid NOT NULL REFERENCES public.labels(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, label_id)
);
CREATE INDEX idx_task_labels_task ON public.task_labels(task_id);
CREATE INDEX idx_task_labels_label ON public.task_labels(label_id);

-- ============================================
-- Notifications
-- ============================================

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, body text, link text, icon text,
  status public.notification_status NOT NULL DEFAULT 'UNREAD',
  source_type text, source_id uuid,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX idx_notifications_org ON public.notifications(org_id);
CREATE INDEX idx_notifications_created ON public.notifications(user_id, created_at DESC);

-- ============================================
-- Files
-- ============================================

CREATE TABLE public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, original_name text NOT NULL, mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0, storage_path text NOT NULL,
  folder text NOT NULL DEFAULT '/', metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_files_org ON public.files(org_id);
CREATE INDEX idx_files_org_folder ON public.files(org_id, folder);
CREATE TRIGGER set_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.entity_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('contact','company','deal','invoice','task','event','form_submission')),
  entity_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(file_id, entity_type, entity_id)
);
CREATE INDEX idx_entity_files_file ON public.entity_files(file_id);
CREATE INDEX idx_entity_files_entity ON public.entity_files(entity_type, entity_id);
CREATE INDEX idx_entity_files_org ON public.entity_files(org_id);

-- ============================================
-- Calendar Events
-- ============================================

CREATE TABLE public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL, description text, location text,
  start_at timestamptz NOT NULL, end_at timestamptz, all_day boolean NOT NULL DEFAULT false,
  status public.event_status NOT NULL DEFAULT 'SCHEDULED', color text,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_calendar_events_org ON public.calendar_events(org_id);
CREATE INDEX idx_calendar_events_time_range ON public.calendar_events(org_id, start_at, end_at);
CREATE TRIGGER calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Messaging
-- ============================================

CREATE TABLE public.message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, subject text, body text NOT NULL DEFAULT '',
  channel public.message_channel NOT NULL DEFAULT 'EMAIL',
  variables jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_templates_org ON public.message_templates(org_id);
CREATE TRIGGER set_message_templates_updated_at BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel public.message_channel NOT NULL DEFAULT 'EMAIL',
  status public.message_status NOT NULL DEFAULT 'DRAFT',
  subject text, body text NOT NULL DEFAULT '',
  recipient_email text, recipient_name text,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  template_id uuid REFERENCES public.message_templates(id) ON DELETE SET NULL,
  sent_at timestamptz, error_message text, metadata jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_org ON public.messages(org_id);
CREATE INDEX idx_messages_status ON public.messages(org_id, status);
CREATE TRIGGER set_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Forms
-- ============================================

CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL, description text, slug text,
  status public.form_status NOT NULL DEFAULT 'DRAFT',
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  share_token uuid DEFAULT gen_random_uuid(),
  submission_count integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT forms_slug_org_unique UNIQUE (org_id, slug)
);
CREATE INDEX idx_forms_org ON public.forms(org_id);
CREATE INDEX idx_forms_status ON public.forms(org_id, status);
CREATE INDEX idx_forms_share_token ON public.forms(share_token);
CREATE TRIGGER set_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TABLE public.form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  source_ip text, user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(), metadata jsonb DEFAULT '{}'::jsonb
);
CREATE INDEX idx_form_submissions_form ON public.form_submissions(form_id);
CREATE INDEX idx_form_submissions_org ON public.form_submissions(org_id);

CREATE OR REPLACE FUNCTION public.increment_form_submission_count()
RETURNS TRIGGER AS $$ BEGIN UPDATE public.forms SET submission_count = submission_count + 1 WHERE id = NEW.form_id; RETURN NEW; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_increment_submission_count
  AFTER INSERT ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.increment_form_submission_count();

-- ============================================
-- Chat Messages
-- ============================================

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.chat_role NOT NULL,
  content text NOT NULL,
  job_id text,
  job_status public.chat_job_status,
  job_detail jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_chat_messages_org ON public.chat_messages(org_id, created_at DESC);
CREATE INDEX idx_chat_messages_job ON public.chat_messages(job_id) WHERE job_id IS NOT NULL;

-- ============================================
-- RLS — All tables
-- ============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entity_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "Members can view their org" ON public.organizations FOR SELECT USING (id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Owners can update their org" ON public.organizations FOR UPDATE USING (owner_id = auth.uid());

-- Organization members
CREATE POLICY "Members can view org members" ON public.organization_members FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can insert members" ON public.organization_members FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_admin_org_ids()));
CREATE POLICY "Admins can update members" ON public.organization_members FOR UPDATE USING (org_id IN (SELECT public.get_user_admin_org_ids()));
CREATE POLICY "Admins can delete members" ON public.organization_members FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Invite codes
CREATE POLICY "Anyone can validate invite codes" ON public.invite_codes FOR SELECT USING (true);
CREATE POLICY "Admins can manage invite codes" ON public.invite_codes FOR ALL USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Companies
CREATE POLICY "Org members can view companies" ON public.companies FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create companies" ON public.companies FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update companies" ON public.companies FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete companies" ON public.companies FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Contacts
CREATE POLICY "Org members can view contacts" ON public.contacts FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create contacts" ON public.contacts FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update contacts" ON public.contacts FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Deals
CREATE POLICY "Org members can view deals" ON public.deals FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create deals" ON public.deals FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update deals" ON public.deals FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete deals" ON public.deals FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Activities
CREATE POLICY "Org members can view activities" ON public.activities FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create activities" ON public.activities FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update activities" ON public.activities FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete activities" ON public.activities FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Invoices
CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create invoices" ON public.invoices FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update invoices" ON public.invoices FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete invoices" ON public.invoices FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));
CREATE POLICY "Anyone can view invoices by share_token" ON public.invoices FOR SELECT USING (share_token IS NOT NULL);

-- Invoice sequences
CREATE POLICY "Org members can manage invoice sequences" ON public.invoice_sequences FOR ALL USING (org_id IN (SELECT public.get_user_org_ids()));

-- Recurring invoices
CREATE POLICY "Org members can view recurring invoices" ON public.recurring_invoices FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create recurring invoices" ON public.recurring_invoices FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update recurring invoices" ON public.recurring_invoices FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can delete recurring invoices" ON public.recurring_invoices FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));

-- Tags
CREATE POLICY "Org members can view tags" ON public.tags FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create tags" ON public.tags FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update tags" ON public.tags FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete tags" ON public.tags FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Entity tags
CREATE POLICY "Org members can view entity tags" ON public.entity_tags FOR SELECT USING (tag_id IN (SELECT id FROM public.tags WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can create entity tags" ON public.entity_tags FOR INSERT WITH CHECK (tag_id IN (SELECT id FROM public.tags WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can delete entity tags" ON public.entity_tags FOR DELETE USING (tag_id IN (SELECT id FROM public.tags WHERE org_id IN (SELECT public.get_user_org_ids())));

-- Boards
CREATE POLICY "Org members can view boards" ON public.boards FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create boards" ON public.boards FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update boards" ON public.boards FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete boards" ON public.boards FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Board columns (via board)
CREATE POLICY "Org members can view board columns" ON public.board_columns FOR SELECT USING (board_id IN (SELECT id FROM public.boards WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can create board columns" ON public.board_columns FOR INSERT WITH CHECK (board_id IN (SELECT id FROM public.boards WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can update board columns" ON public.board_columns FOR UPDATE USING (board_id IN (SELECT id FROM public.boards WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can delete board columns" ON public.board_columns FOR DELETE USING (board_id IN (SELECT id FROM public.boards WHERE org_id IN (SELECT public.get_user_org_ids())));

-- Labels
CREATE POLICY "Org members can view labels" ON public.labels FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create labels" ON public.labels FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update labels" ON public.labels FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can delete labels" ON public.labels FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));

-- Tasks
CREATE POLICY "Org members can view tasks" ON public.tasks FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create tasks" ON public.tasks FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update tasks" ON public.tasks FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete tasks" ON public.tasks FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Task labels (via task)
CREATE POLICY "Org members can view task labels" ON public.task_labels FOR SELECT USING (task_id IN (SELECT id FROM public.tasks WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can manage task labels" ON public.task_labels FOR INSERT WITH CHECK (task_id IN (SELECT id FROM public.tasks WHERE org_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can remove task labels" ON public.task_labels FOR DELETE USING (task_id IN (SELECT id FROM public.tasks WHERE org_id IN (SELECT public.get_user_org_ids())));

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Org members can create notifications" ON public.notifications FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- Files
CREATE POLICY "files_select" ON public.files FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "files_insert" ON public.files FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "files_update" ON public.files FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "files_delete" ON public.files FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));

-- Entity files
CREATE POLICY "entity_files_select" ON public.entity_files FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "entity_files_insert" ON public.entity_files FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "entity_files_delete" ON public.entity_files FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));

-- Storage bucket policies
CREATE POLICY "org_files_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'org-files');
CREATE POLICY "org_files_select" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'org-files');
CREATE POLICY "org_files_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'org-files');
CREATE POLICY "org_files_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'org-files');

-- Calendar events
CREATE POLICY "Org members can view events" ON public.calendar_events FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can create events" ON public.calendar_events FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update events" ON public.calendar_events FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Admins can delete events" ON public.calendar_events FOR DELETE USING (org_id IN (SELECT public.get_user_admin_org_ids()));

-- Message templates
CREATE POLICY "message_templates_select" ON public.message_templates FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "message_templates_insert" ON public.message_templates FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "message_templates_update" ON public.message_templates FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "message_templates_delete" ON public.message_templates FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));

-- Messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));

-- Forms
CREATE POLICY "Users can view forms in their org" ON public.forms FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Users can create forms in their org" ON public.forms FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Users can update forms in their org" ON public.forms FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Users can delete forms in their org" ON public.forms FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Public can view active forms by share_token" ON public.forms FOR SELECT USING (status = 'ACTIVE' AND share_token IS NOT NULL);

-- Form submissions
CREATE POLICY "Users can view submissions in their org" ON public.form_submissions FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Users can delete submissions in their org" ON public.form_submissions FOR DELETE USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Anyone can submit to forms" ON public.form_submissions FOR INSERT WITH CHECK (true);

-- Chat messages
CREATE POLICY "Org members can view chat messages" ON public.chat_messages FOR SELECT USING (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (org_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update chat messages" ON public.chat_messages FOR UPDATE USING (org_id IN (SELECT public.get_user_org_ids()));
