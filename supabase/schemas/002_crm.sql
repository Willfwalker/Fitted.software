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
