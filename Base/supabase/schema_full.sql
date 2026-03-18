-- ============================================
-- Fitted Agency — Full Schema (auto-generated)
-- Generated: 2026-03-17T15:10:30Z
-- DO NOT EDIT — regenerate with scripts/build-schema.sh
-- ============================================


-- ---- 001_base.sql ----

-- ============================================
-- Fitted Agency — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Roles enum
create type public.app_role as enum ('OWNER', 'ADMIN', 'MEMBER');

-- Organizations
create table public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  enabled_modules jsonb not null default '["crm","tasks","calendar","invoicing","messaging","files","forms","reports"]',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Organization members (join table)
create table public.organization_members (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.app_role not null default 'MEMBER',
  created_at  timestamptz default now(),
  unique(user_id, org_id)
);

-- Indexes
create index idx_org_members_user  on public.organization_members(user_id);
create index idx_org_members_org   on public.organization_members(org_id);
create index idx_organizations_owner on public.organizations(owner_id);

-- Invite codes
create table public.invite_codes (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  code        text unique not null,
  created_by  uuid not null references auth.users(id) on delete cascade,
  expires_at  timestamptz,
  max_uses    int not null default 25,
  use_count   int not null default 0,
  created_at  timestamptz default now()
);

create index idx_invite_codes_code on public.invite_codes(code);
create index idx_invite_codes_org  on public.invite_codes(org_id);

alter table public.invite_codes enable row level security;

-- Anyone can read invite codes (needed for pre-signup validation)
create policy "Anyone can validate invite codes"
  on public.invite_codes for select
  using (true);

-- Owners/admins can create and update invite codes
create policy "Owners and admins can manage invite codes"
  on public.invite_codes for all
  using (
    org_id in (
      select om.org_id from public.organization_members om
      where om.user_id = auth.uid() and om.role in ('OWNER', 'ADMIN')
    )
  );

-- ============================================
-- Helper: check if any org exists (used by proxy)
-- ============================================

create or replace function public.org_exists()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (select 1 from public.organizations limit 1);
$$;

-- ============================================
-- Row Level Security
-- ============================================

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

-- Users can read orgs they belong to
create policy "Members can view their org"
  on public.organizations for select
  using (
    id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Owners can update their org
create policy "Owners can update their org"
  on public.organizations for update
  using (owner_id = auth.uid());

-- Members can view membership list for their orgs
create policy "Members can view org members"
  on public.organization_members for select
  using (
    org_id in (
      select org_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Owners/admins can manage members
create policy "Owners and admins can manage members"
  on public.organization_members for all
  using (
    org_id in (
      select om.org_id from public.organization_members om
      where om.user_id = auth.uid() and om.role in ('OWNER', 'ADMIN')
    )
  );

-- ============================================
-- Updated-at trigger
-- ============================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.update_updated_at();

-- ============================================
-- CRM Module
-- ============================================

-- Enums
create type public.deal_stage as enum ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
create type public.deal_priority as enum ('LOW', 'MEDIUM', 'HIGH');
create type public.activity_type as enum (
  'NOTE', 'EMAIL', 'CALL', 'MEETING',
  'DEAL_CREATED', 'DEAL_STAGE_CHANGED',
  'CONTACT_CREATED', 'COMPANY_CREATED'
);

-- Companies
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  domain        text,
  industry      text,
  phone         text,
  email         text,
  address       text,
  notes         text,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_companies_org on public.companies(org_id);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

-- Contacts
create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  title         text,
  company_id    uuid references public.companies(id) on delete set null,
  notes         text,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_contacts_org on public.contacts(org_id);
create index idx_contacts_company on public.contacts(company_id);

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.update_updated_at();

-- Deals
create table public.deals (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  title               text not null,
  value               numeric(12,2),
  stage               public.deal_stage not null default 'LEAD',
  priority            public.deal_priority not null default 'MEDIUM',
  contact_id          uuid references public.contacts(id) on delete set null,
  company_id          uuid references public.companies(id) on delete set null,
  expected_close_date date,
  closed_at           timestamptz,
  assigned_to         uuid references auth.users(id) on delete set null,
  position            integer not null default 0,
  notes               text,
  created_by          uuid not null references auth.users(id) on delete set null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_deals_org on public.deals(org_id);
create index idx_deals_stage_position on public.deals(org_id, stage, position);
create index idx_deals_contact on public.deals(contact_id);
create index idx_deals_company on public.deals(company_id);

create trigger deals_updated_at
  before update on public.deals
  for each row execute function public.update_updated_at();

-- Activities (polymorphic: links to contact, deal, or company)
create table public.activities (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  contact_id    uuid references public.contacts(id) on delete cascade,
  deal_id       uuid references public.deals(id) on delete cascade,
  company_id    uuid references public.companies(id) on delete cascade,
  type          public.activity_type not null,
  title         text not null,
  content       text,
  metadata      jsonb,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

create index idx_activities_org on public.activities(org_id);
create index idx_activities_contact on public.activities(contact_id);
create index idx_activities_deal on public.activities(deal_id);
create index idx_activities_company on public.activities(company_id);

-- ============================================
-- CRM Row Level Security
-- ============================================

alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

-- Companies RLS
create policy "Org members can view companies"
  on public.companies for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create companies"
  on public.companies for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update companies"
  on public.companies for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete companies"
  on public.companies for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Contacts RLS
create policy "Org members can view contacts"
  on public.contacts for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create contacts"
  on public.contacts for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update contacts"
  on public.contacts for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete contacts"
  on public.contacts for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Deals RLS
create policy "Org members can view deals"
  on public.deals for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create deals"
  on public.deals for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update deals"
  on public.deals for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete deals"
  on public.deals for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Activities RLS
create policy "Org members can view activities"
  on public.activities for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create activities"
  on public.activities for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update activities"
  on public.activities for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete activities"
  on public.activities for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- ---- 002_crm.sql ----

-- ============================================
-- CRM Migration — Run AFTER the original schema.sql
-- ============================================

-- Enums
create type public.deal_stage as enum ('LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST');
create type public.deal_priority as enum ('LOW', 'MEDIUM', 'HIGH');
create type public.activity_type as enum (
  'NOTE', 'EMAIL', 'CALL', 'MEETING',
  'DEAL_CREATED', 'DEAL_STAGE_CHANGED',
  'CONTACT_CREATED', 'COMPANY_CREATED'
);

-- Companies
create table public.companies (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  domain        text,
  industry      text,
  phone         text,
  email         text,
  address       text,
  notes         text,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_companies_org on public.companies(org_id);

create trigger companies_updated_at
  before update on public.companies
  for each row execute function public.update_updated_at();

-- Contacts
create table public.contacts (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  title         text,
  company_id    uuid references public.companies(id) on delete set null,
  notes         text,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_contacts_org on public.contacts(org_id);
create index idx_contacts_company on public.contacts(company_id);

create trigger contacts_updated_at
  before update on public.contacts
  for each row execute function public.update_updated_at();

-- Deals
create table public.deals (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references public.organizations(id) on delete cascade,
  title               text not null,
  value               numeric(12,2),
  stage               public.deal_stage not null default 'LEAD',
  priority            public.deal_priority not null default 'MEDIUM',
  contact_id          uuid references public.contacts(id) on delete set null,
  company_id          uuid references public.companies(id) on delete set null,
  expected_close_date date,
  closed_at           timestamptz,
  assigned_to         uuid references auth.users(id) on delete set null,
  position            integer not null default 0,
  notes               text,
  created_by          uuid not null references auth.users(id) on delete set null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index idx_deals_org on public.deals(org_id);
create index idx_deals_stage_position on public.deals(org_id, stage, position);
create index idx_deals_contact on public.deals(contact_id);
create index idx_deals_company on public.deals(company_id);

create trigger deals_updated_at
  before update on public.deals
  for each row execute function public.update_updated_at();

-- Activities
create table public.activities (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  contact_id    uuid references public.contacts(id) on delete cascade,
  deal_id       uuid references public.deals(id) on delete cascade,
  company_id    uuid references public.companies(id) on delete cascade,
  type          public.activity_type not null,
  title         text not null,
  content       text,
  metadata      jsonb,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now()
);

create index idx_activities_org on public.activities(org_id);
create index idx_activities_contact on public.activities(contact_id);
create index idx_activities_deal on public.activities(deal_id);
create index idx_activities_company on public.activities(company_id);

-- RLS
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

-- Companies RLS
create policy "Org members can view companies"
  on public.companies for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create companies"
  on public.companies for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update companies"
  on public.companies for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete companies"
  on public.companies for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Contacts RLS
create policy "Org members can view contacts"
  on public.contacts for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create contacts"
  on public.contacts for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update contacts"
  on public.contacts for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete contacts"
  on public.contacts for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Deals RLS
create policy "Org members can view deals"
  on public.deals for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create deals"
  on public.deals for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update deals"
  on public.deals for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete deals"
  on public.deals for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Activities RLS
create policy "Org members can view activities"
  on public.activities for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create activities"
  on public.activities for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update activities"
  on public.activities for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete activities"
  on public.activities for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- ---- 003_invoicing_tags.sql ----

-- ============================================
-- Phase 2: Invoicing + Tags
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================

-- Invoice status enum
create type public.invoice_status as enum ('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- Invoice sequence helper (one row per org for atomic numbering)
create table public.invoice_sequences (
  org_id    uuid primary key references public.organizations(id) on delete cascade,
  next_num  integer not null default 1
);

-- Invoices
create table public.invoices (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  invoice_number  text not null,
  deal_id         uuid references public.deals(id) on delete set null,
  contact_id      uuid references public.contacts(id) on delete set null,
  company_id      uuid references public.companies(id) on delete set null,
  status          public.invoice_status not null default 'DRAFT',
  items           jsonb not null default '[]'::jsonb,
  subtotal        numeric(12,2) not null default 0,
  tax_rate        numeric(5,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total           numeric(12,2) not null default 0,
  due_date        date,
  paid_at         timestamptz,
  notes           text,
  created_by      uuid not null references auth.users(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_invoices_org on public.invoices(org_id);
create index idx_invoices_status on public.invoices(org_id, status);
create index idx_invoices_deal on public.invoices(deal_id);
create index idx_invoices_contact on public.invoices(contact_id);
create index idx_invoices_company on public.invoices(company_id);

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.update_updated_at();

-- Atomic invoice number generator
create or replace function public.next_invoice_number(p_org_id uuid)
returns text
language plpgsql
security definer
as $$
declare
  v_num integer;
begin
  insert into public.invoice_sequences (org_id, next_num)
  values (p_org_id, 2)
  on conflict (org_id) do update
    set next_num = public.invoice_sequences.next_num + 1
  returning next_num - 1 into v_num;

  return 'INV-' || lpad(v_num::text, 4, '0');
end;
$$;

-- Extend activity_type enum
alter type public.activity_type add value 'INVOICE_CREATED';
alter type public.activity_type add value 'INVOICE_STATUS_CHANGED';

-- ============================================
-- Tags
-- ============================================

create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  name        text not null,
  color       text not null default '#8A817A',
  created_at  timestamptz default now(),
  unique(org_id, name)
);

create index idx_tags_org on public.tags(org_id);

create table public.entity_tags (
  id          uuid primary key default gen_random_uuid(),
  tag_id      uuid not null references public.tags(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact', 'company', 'deal')),
  entity_id   uuid not null,
  unique(tag_id, entity_type, entity_id)
);

create index idx_entity_tags_entity on public.entity_tags(entity_type, entity_id);
create index idx_entity_tags_tag on public.entity_tags(tag_id);

-- ============================================
-- Invoices RLS
-- ============================================

alter table public.invoices enable row level security;

create policy "Org members can view invoices"
  on public.invoices for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create invoices"
  on public.invoices for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update invoices"
  on public.invoices for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete invoices"
  on public.invoices for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- ============================================
-- Tags RLS
-- ============================================

alter table public.tags enable row level security;
alter table public.entity_tags enable row level security;

create policy "Org members can view tags"
  on public.tags for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create tags"
  on public.tags for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update tags"
  on public.tags for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete tags"
  on public.tags for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- entity_tags: scoped via join to tags table
create policy "Org members can view entity tags"
  on public.entity_tags for select
  using (tag_id in (
    select id from public.tags
    where org_id in (select org_id from public.organization_members where user_id = auth.uid())
  ));

create policy "Org members can create entity tags"
  on public.entity_tags for insert
  with check (tag_id in (
    select id from public.tags
    where org_id in (select org_id from public.organization_members where user_id = auth.uid())
  ));

create policy "Org members can delete entity tags"
  on public.entity_tags for delete
  using (tag_id in (
    select id from public.tags
    where org_id in (select org_id from public.organization_members where user_id = auth.uid())
  ));

-- Invoice sequences RLS
alter table public.invoice_sequences enable row level security;

create policy "Org members can manage invoice sequences"
  on public.invoice_sequences for all
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

-- ---- 004_pdf_email_recurring.sql ----

-- ============================================
-- Phase 3: PDF Export, Email Delivery & Recurring Invoices
-- Run in Supabase SQL Editor
-- ============================================

-- 0. Extend activity_type enum with new values
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'INVOICE_SENT';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'INVOICE_RECURRING_CREATED';

-- 1. Add share_token to invoices for public share links
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT NULL UNIQUE;

CREATE INDEX IF NOT EXISTS idx_invoices_share_token
  ON public.invoices(share_token) WHERE share_token IS NOT NULL;

-- Allow public (anon) read access by share_token
CREATE POLICY "Anyone can view invoices by share_token"
  ON public.invoices FOR SELECT
  USING (share_token IS NOT NULL AND share_token = share_token);
-- Note: the actual filtering happens in the query (WHERE share_token = $1).
-- This policy just allows anon reads when a share_token exists.

-- 2. Recurring invoices table
CREATE TABLE IF NOT EXISTS public.recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('WEEKLY','BIWEEKLY','MONTHLY','QUARTERLY','YEARLY')),
  next_run_date date NOT NULL,
  end_date date DEFAULT NULL,
  runs_count integer NOT NULL DEFAULT 0,
  max_runs integer DEFAULT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','PAUSED','COMPLETED')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_org
  ON public.recurring_invoices(org_id);

CREATE INDEX IF NOT EXISTS idx_recurring_invoices_status_date
  ON public.recurring_invoices(status, next_run_date)
  WHERE status = 'ACTIVE';

-- Updated_at trigger (reuses existing function)
CREATE TRIGGER recurring_invoices_updated_at
  BEFORE UPDATE ON public.recurring_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view recurring invoices"
  ON public.recurring_invoices FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can create recurring invoices"
  ON public.recurring_invoices FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can update recurring invoices"
  ON public.recurring_invoices FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Org members can delete recurring invoices"
  ON public.recurring_invoices FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.organization_members WHERE user_id = auth.uid()
  ));

-- ---- 005_tasks.sql ----

-- ============================================
-- Tasks/Workflow Migration — Run AFTER 004_pdf_email_recurring.sql
-- ============================================

-- Enums
create type public.task_priority as enum ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');

-- Extend activity_type with task events
alter type public.activity_type add value 'TASK_CREATED';
alter type public.activity_type add value 'TASK_STATUS_CHANGED';
alter type public.activity_type add value 'TASK_ASSIGNED';

-- Boards (pipeline containers)
create table public.boards (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  description   text,
  archived      boolean not null default false,
  metadata      jsonb,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_boards_org on public.boards(org_id);

create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.update_updated_at();

-- Board Columns (stages with position + optional WIP limit)
create table public.board_columns (
  id            uuid primary key default gen_random_uuid(),
  board_id      uuid not null references public.boards(id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  wip_limit     integer,
  color         text,
  metadata      jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_board_columns_board on public.board_columns(board_id);
create index idx_board_columns_position on public.board_columns(board_id, position);

create trigger board_columns_updated_at
  before update on public.board_columns
  for each row execute function public.update_updated_at();

-- Labels (org-scoped)
create table public.labels (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  color         text not null default '#8A817A',
  created_at    timestamptz default now()
);

create index idx_labels_org on public.labels(org_id);

-- Tasks (cards)
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  board_id          uuid not null references public.boards(id) on delete cascade,
  column_id         uuid not null references public.board_columns(id) on delete cascade,
  title             text not null,
  description       text,
  priority          public.task_priority not null default 'NONE',
  status            public.task_status not null default 'TODO',
  due_date          date,
  assigned_to       uuid references auth.users(id) on delete set null,
  contact_id        uuid references public.contacts(id) on delete set null,
  company_id        uuid references public.companies(id) on delete set null,
  deal_id           uuid references public.deals(id) on delete set null,
  position          integer not null default 0,
  metadata          jsonb,
  created_by        uuid not null references auth.users(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_tasks_org on public.tasks(org_id);
create index idx_tasks_board on public.tasks(board_id);
create index idx_tasks_column_position on public.tasks(column_id, position);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_contact on public.tasks(contact_id);
create index idx_tasks_company on public.tasks(company_id);
create index idx_tasks_deal on public.tasks(deal_id);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();

-- Task Labels (many-to-many)
create table public.task_labels (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  label_id      uuid not null references public.labels(id) on delete cascade,
  created_at    timestamptz default now(),
  unique(task_id, label_id)
);

create index idx_task_labels_task on public.task_labels(task_id);
create index idx_task_labels_label on public.task_labels(label_id);

-- RLS
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.labels enable row level security;
alter table public.tasks enable row level security;
alter table public.task_labels enable row level security;

-- Boards RLS
create policy "Org members can view boards"
  on public.boards for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create boards"
  on public.boards for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update boards"
  on public.boards for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete boards"
  on public.boards for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Board Columns RLS (via board's org)
create policy "Org members can view board columns"
  on public.board_columns for select
  using (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can create board columns"
  on public.board_columns for insert
  with check (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can update board columns"
  on public.board_columns for update
  using (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can delete board columns"
  on public.board_columns for delete
  using (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

-- Labels RLS
create policy "Org members can view labels"
  on public.labels for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create labels"
  on public.labels for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update labels"
  on public.labels for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can delete labels"
  on public.labels for delete
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

-- Tasks RLS
create policy "Org members can view tasks"
  on public.tasks for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create tasks"
  on public.tasks for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update tasks"
  on public.tasks for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete tasks"
  on public.tasks for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Task Labels RLS (via task's org)
create policy "Org members can view task labels"
  on public.task_labels for select
  using (task_id in (
    select id from public.tasks where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can manage task labels"
  on public.task_labels for insert
  with check (task_id in (
    select id from public.tasks where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can remove task labels"
  on public.task_labels for delete
  using (task_id in (
    select id from public.tasks where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

-- ---- 006_notifications.sql ----

-- ============================================
-- Notifications Migration — Run AFTER 005_tasks.sql
-- ============================================

-- Enum
create type public.notification_status as enum ('UNREAD', 'READ', 'ARCHIVED');

-- Notifications table
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  body          text,
  link          text,
  icon          text,
  status        public.notification_status not null default 'UNREAD',
  source_type   text,
  source_id     uuid,
  created_at    timestamptz default now()
);

-- Indexes
create index idx_notifications_user_status on public.notifications(user_id, status);
create index idx_notifications_org on public.notifications(org_id);
create index idx_notifications_created on public.notifications(user_id, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Org members can create notifications"
  on public.notifications for insert
  with check (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Users can update own notifications"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (user_id = auth.uid());

-- ---- 007_files.sql ----

-- ============================================
-- 007: File Storage & Document Management
-- ============================================

-- ----------------------------------------
-- Tables
-- ----------------------------------------

create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  original_name text not null,
  mime_type    text not null,
  size_bytes   bigint not null default 0,
  storage_path text not null,
  folder       text not null default '/',
  metadata     jsonb default '{}'::jsonb,
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.entity_files (
  id          uuid primary key default gen_random_uuid(),
  file_id     uuid not null references public.files(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact', 'company', 'deal', 'invoice', 'task', 'event', 'form_submission')),
  entity_id   uuid not null,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  unique(file_id, entity_type, entity_id)
);

-- ----------------------------------------
-- Activity type extensions
-- ----------------------------------------

alter type public.activity_type add value if not exists 'FILE_UPLOADED';

-- ----------------------------------------
-- Indexes
-- ----------------------------------------

create index if not exists idx_files_org on public.files(org_id);
create index if not exists idx_files_org_folder on public.files(org_id, folder);
create index if not exists idx_files_created_by on public.files(created_by);
create index if not exists idx_files_created_at on public.files(created_at desc);
create index if not exists idx_entity_files_file on public.entity_files(file_id);
create index if not exists idx_entity_files_entity on public.entity_files(entity_type, entity_id);
create index if not exists idx_entity_files_org on public.entity_files(org_id);

-- ----------------------------------------
-- Triggers
-- ----------------------------------------

create trigger set_files_updated_at
  before update on public.files
  for each row execute function public.update_updated_at();

-- ----------------------------------------
-- RLS
-- ----------------------------------------

alter table public.files enable row level security;
alter table public.entity_files enable row level security;

-- files: select for org members
create policy "files_select" on public.files
  for select using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- files: insert for org members
create policy "files_insert" on public.files
  for insert with check (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- files: update for org members
create policy "files_update" on public.files
  for update using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- files: delete for org members
create policy "files_delete" on public.files
  for delete using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- entity_files: select for org members
create policy "entity_files_select" on public.entity_files
  for select using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- entity_files: insert for org members
create policy "entity_files_insert" on public.entity_files
  for insert with check (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- entity_files: delete for org members
create policy "entity_files_delete" on public.entity_files
  for delete using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- ----------------------------------------
-- Storage bucket policies (org-files)
-- ----------------------------------------

create policy "org_files_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'org-files');

create policy "org_files_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'org-files');

create policy "org_files_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'org-files');

create policy "org_files_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'org-files');

-- ---- 008_scheduling.sql ----

-- ============================================
-- Scheduling & Calendar — Run AFTER 007_files.sql
-- ============================================

-- Enums
create type public.event_status as enum ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- Extend activity_type
alter type public.activity_type add value 'EVENT_CREATED';
alter type public.activity_type add value 'EVENT_COMPLETED';

-- Main table
create table public.calendar_events (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  title         text not null,
  description   text,
  location      text,
  start_at      timestamptz not null,
  end_at        timestamptz,
  all_day       boolean not null default false,
  status        public.event_status not null default 'SCHEDULED',
  color         text,
  contact_id    uuid references public.contacts(id) on delete set null,
  company_id    uuid references public.companies(id) on delete set null,
  deal_id       uuid references public.deals(id) on delete set null,
  assigned_to   uuid references auth.users(id) on delete set null,
  metadata      jsonb,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Indexes
create index idx_calendar_events_org on public.calendar_events(org_id);
create index idx_calendar_events_time_range on public.calendar_events(org_id, start_at, end_at);
create index idx_calendar_events_assigned on public.calendar_events(assigned_to);
create index idx_calendar_events_contact on public.calendar_events(contact_id);
create index idx_calendar_events_company on public.calendar_events(company_id);
create index idx_calendar_events_deal on public.calendar_events(deal_id);

-- updated_at trigger
create trigger calendar_events_updated_at
  before update on public.calendar_events
  for each row execute function public.update_updated_at();

-- RLS
alter table public.calendar_events enable row level security;

create policy "Org members can view events"
  on public.calendar_events for select
  using (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Org members can create events"
  on public.calendar_events for insert
  with check (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Org members can update events"
  on public.calendar_events for update
  using (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Owners and admins can delete events"
  on public.calendar_events for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- ---- 009_messaging.sql ----

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

-- ---- 010_forms.sql ----

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

-- ---- 011_chat.sql ----

-- ============================================
-- Chat Messages — AI Feature Request History
-- ============================================

create type public.chat_role as enum ('user', 'assistant', 'status');
create type public.chat_job_status as enum ('pending', 'running', 'complete', 'rejected', 'failed');

create table public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  created_by    uuid not null references auth.users(id) on delete cascade,
  role          public.chat_role not null,
  content       text not null,
  job_id        text,
  job_status    public.chat_job_status,
  job_detail    jsonb,
  created_at    timestamptz default now()
);

-- Indexes
create index idx_chat_messages_org on public.chat_messages(org_id, created_at desc);
create index idx_chat_messages_job on public.chat_messages(job_id) where job_id is not null;

-- RLS
alter table public.chat_messages enable row level security;

create policy "Org members can view chat messages"
  on public.chat_messages for select
  using (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Org members can insert chat messages"
  on public.chat_messages for insert
  with check (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

create policy "Org members can update chat messages"
  on public.chat_messages for update
  using (org_id in (
    select org_id from public.organization_members where user_id = auth.uid()
  ));

-- ---- 012_notification_preferences.sql ----

-- ============================================
-- 012: Notification Preferences
-- ============================================

create table if not exists notification_preferences (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (org_id, user_id, category)
);

alter table notification_preferences enable row level security;

-- Users can read their own preferences
create policy "Users can view own notification preferences"
  on notification_preferences for select
  using (user_id = auth.uid());

-- Users can insert their own preferences
create policy "Users can insert own notification preferences"
  on notification_preferences for insert
  with check (user_id = auth.uid());

-- Users can update their own preferences
create policy "Users can update own notification preferences"
  on notification_preferences for update
  using (user_id = auth.uid());

-- Auto-update updated_at
create trigger set_notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function update_updated_at();

-- ---- 013_integrations.sql ----

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

-- ---- 014_time_tracking.sql ----

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

-- ---- 015_stripe.sql ----

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

-- ---- 016_client_portal.sql ----

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

-- ---- 017_email_threads.sql ----

-- ============================================
-- 017: Email Threads & Inbound
-- ============================================

-- Add EMAIL_RECEIVED to activity_type enum
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'EMAIL_RECEIVED';

-- Add threading/direction columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS direction text NOT NULL DEFAULT 'OUTBOUND';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS resend_email_id text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS in_reply_to text;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_id_header text;

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_message_id_header ON messages(message_id_header);
CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);

-- ---- 018_automations.sql ----

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

-- ---- 019_google_calendar.sql ----

-- ============================================
-- 019: Google Calendar Integration
-- ============================================

-- Add Google Calendar fields to calendar_events
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS google_calendar_id text;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON calendar_events(google_event_id);
