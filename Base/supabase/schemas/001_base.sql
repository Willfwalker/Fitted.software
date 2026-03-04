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
-- Handle new user signup (branches on role)
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  signup_role text;
  base_name text;
  org_slug text;
  new_org_id uuid;
  org_name text;
  invite record;
  invite_code_val text;
begin
  signup_role := coalesce(new.raw_user_meta_data ->> 'signup_role', 'OWNER');

  if signup_role = 'MEMBER' then
    -- Employee flow: join existing org via invite code
    invite_code_val := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));

    if invite_code_val = '' then
      raise exception 'Invite code is required for employee signup';
    end if;

    select * into invite
    from public.invite_codes
    where code = invite_code_val;

    if not found then
      raise exception 'Invalid invite code';
    end if;

    if invite.expires_at is not null and invite.expires_at < now() then
      raise exception 'Invite code has expired';
    end if;

    if invite.use_count >= invite.max_uses then
      raise exception 'Invite code has reached its usage limit';
    end if;

    -- Join the org as MEMBER
    insert into public.organization_members (org_id, user_id, role)
    values (invite.org_id, new.id, 'MEMBER');

    -- Increment use count
    update public.invite_codes
    set use_count = use_count + 1
    where id = invite.id;

  else
    -- Owner flow: create new org
    org_name := coalesce(nullif(trim(new.raw_user_meta_data ->> 'org_name'), ''),
                         coalesce(new.raw_user_meta_data ->> 'full_name',
                                  split_part(new.email, '@', 1)) || '''s Org');

    base_name := split_part(new.email, '@', 1);
    org_slug  := lower(regexp_replace(base_name, '[^a-z0-9]+', '-', 'g'));
    org_slug  := trim(both '-' from org_slug);

    -- Ensure slug uniqueness
    while exists (select 1 from public.organizations where slug = org_slug) loop
      org_slug := org_slug || '-' || substr(gen_random_uuid()::text, 1, 4);
    end loop;

    insert into public.organizations (name, slug, owner_id)
    values (org_name, org_slug, new.id)
    returning id into new_org_id;

    insert into public.organization_members (org_id, user_id, role)
    values (new_org_id, new.id, 'OWNER');
  end if;

  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
