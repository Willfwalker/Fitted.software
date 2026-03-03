-- ============================================
-- FITTED AGENCY — Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- MULTI-TENANT: Organizations
-- ============================================

create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);

-- Index for fast membership lookups
create index idx_org_members_user on public.organization_members(user_id);
create index idx_org_members_org on public.organization_members(org_id);

-- ============================================
-- ENTITY SYSTEM (the heart of the platform)
-- ============================================

create table public.entities (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  display_name text not null,
  slug text not null,
  icon text default 'file-text',
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique(org_id, slug)
);

create index idx_entities_org on public.entities(org_id);

create table public.entity_fields (
  id uuid primary key default uuid_generate_v4(),
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  display_name text not null,
  field_type text not null check (field_type in (
    'text', 'textarea', 'number', 'email', 'phone', 'url',
    'select', 'multi_select', 'date', 'datetime', 'checkbox',
    'currency', 'rating', 'relation'
  )),
  options jsonb default '{}'::jsonb,
  is_required boolean not null default false,
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(entity_id, name)
);

create index idx_entity_fields_entity on public.entity_fields(entity_id);

create table public.entity_records (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_entity_records_org on public.entity_records(org_id);
create index idx_entity_records_entity on public.entity_records(entity_id);
create index idx_entity_records_data on public.entity_records using gin(data);

-- ============================================
-- VIEW & LAYOUT SYSTEM
-- ============================================

create table public.views (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_id uuid not null references public.entities(id) on delete cascade,
  name text not null,
  view_type text not null check (view_type in ('table', 'board', 'calendar', 'gallery')),
  config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_views_entity on public.views(entity_id);

create table public.pages (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  layout jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(org_id, slug)
);

create index idx_pages_org on public.pages(org_id);

create table public.themes (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade unique,
  variables jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- AI SYSTEM
-- ============================================

create table public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  context jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ai_conversations_user on public.ai_conversations(user_id);

create table public.config_versions (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  previous_value jsonb,
  new_value jsonb,
  changed_by uuid references auth.users(id) on delete set null,
  change_description text,
  created_at timestamptz not null default now()
);

create index idx_config_versions_target on public.config_versions(target_type, target_id);
create index idx_config_versions_org on public.config_versions(org_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.entities enable row level security;
alter table public.entity_fields enable row level security;
alter table public.entity_records enable row level security;
alter table public.views enable row level security;
alter table public.pages enable row level security;
alter table public.themes enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.config_versions enable row level security;

-- Helper: check if user is a member of an org
create or replace function public.is_org_member(check_org_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.organization_members
    where org_id = check_org_id and user_id = auth.uid()
  );
$$;

-- Organizations: members can read
create policy "Members can read own org"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "Owners can update org"
  on public.organizations for update
  using (exists (
    select 1 from public.organization_members
    where org_id = id and user_id = auth.uid() and role = 'owner'
  ));

-- Organization members: members can read members in their org
create policy "Members can read org members"
  on public.organization_members for select
  using (public.is_org_member(org_id));

create policy "Members can insert themselves"
  on public.organization_members for insert
  with check (user_id = auth.uid());

-- Entities: org members can read/write
create policy "Members can read entities"
  on public.entities for select
  using (public.is_org_member(org_id));

create policy "Members can insert entities"
  on public.entities for insert
  with check (public.is_org_member(org_id));

create policy "Members can update entities"
  on public.entities for update
  using (public.is_org_member(org_id));

create policy "Members can delete non-system entities"
  on public.entities for delete
  using (public.is_org_member(org_id) and not is_system);

-- Entity fields: org members (via entity)
create policy "Members can read fields"
  on public.entity_fields for select
  using (exists (
    select 1 from public.entities e
    where e.id = entity_id and public.is_org_member(e.org_id)
  ));

create policy "Members can insert fields"
  on public.entity_fields for insert
  with check (exists (
    select 1 from public.entities e
    where e.id = entity_id and public.is_org_member(e.org_id)
  ));

create policy "Members can update fields"
  on public.entity_fields for update
  using (exists (
    select 1 from public.entities e
    where e.id = entity_id and public.is_org_member(e.org_id)
  ));

create policy "Members can delete non-system fields"
  on public.entity_fields for delete
  using (exists (
    select 1 from public.entities e
    where e.id = entity_id and public.is_org_member(e.org_id)
  ) and not is_system);

-- Entity records: org members
create policy "Members can read records"
  on public.entity_records for select
  using (public.is_org_member(org_id));

create policy "Members can insert records"
  on public.entity_records for insert
  with check (public.is_org_member(org_id));

create policy "Members can update records"
  on public.entity_records for update
  using (public.is_org_member(org_id));

create policy "Members can delete records"
  on public.entity_records for delete
  using (public.is_org_member(org_id));

-- Views
create policy "Members can read views"
  on public.views for select
  using (public.is_org_member(org_id));

create policy "Members can insert views"
  on public.views for insert
  with check (public.is_org_member(org_id));

create policy "Members can update views"
  on public.views for update
  using (public.is_org_member(org_id));

create policy "Members can delete views"
  on public.views for delete
  using (public.is_org_member(org_id));

-- Pages
create policy "Members can read pages"
  on public.pages for select
  using (public.is_org_member(org_id));

create policy "Members can insert pages"
  on public.pages for insert
  with check (public.is_org_member(org_id));

create policy "Members can update pages"
  on public.pages for update
  using (public.is_org_member(org_id));

create policy "Members can delete pages"
  on public.pages for delete
  using (public.is_org_member(org_id));

-- Themes
create policy "Members can read theme"
  on public.themes for select
  using (public.is_org_member(org_id));

create policy "Members can insert theme"
  on public.themes for insert
  with check (public.is_org_member(org_id));

create policy "Members can update theme"
  on public.themes for update
  using (public.is_org_member(org_id));

-- AI conversations
create policy "Users can read own conversations"
  on public.ai_conversations for select
  using (user_id = auth.uid());

create policy "Users can insert own conversations"
  on public.ai_conversations for insert
  with check (user_id = auth.uid() and public.is_org_member(org_id));

create policy "Users can update own conversations"
  on public.ai_conversations for update
  using (user_id = auth.uid());

-- Config versions
create policy "Members can read config versions"
  on public.config_versions for select
  using (public.is_org_member(org_id));

create policy "Members can insert config versions"
  on public.config_versions for insert
  with check (public.is_org_member(org_id));

-- ============================================
-- AUTO-CREATE ORG ON USER SIGNUP
-- ============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  new_org_id uuid;
  user_name text;
  org_slug text;
  clients_entity_id uuid;
begin
  -- Derive name from metadata or email
  user_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  );

  -- Generate unique slug
  org_slug := lower(regexp_replace(user_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

  -- Create organization
  insert into public.organizations (name, slug)
  values (user_name || '''s Workspace', org_slug)
  returning id into new_org_id;

  -- Add user as owner
  insert into public.organization_members (org_id, user_id, role)
  values (new_org_id, new.id, 'owner');

  -- ==========================================
  -- SEED: Default Clients entity
  -- ==========================================
  insert into public.entities (org_id, name, display_name, slug, icon, description, is_system)
  values (new_org_id, 'clients', 'Clients', 'clients', 'users', 'Manage your clients and contacts', true)
  returning id into clients_entity_id;

  -- Seed client fields
  insert into public.entity_fields (entity_id, name, display_name, field_type, options, is_required, is_system, sort_order) values
    (clients_entity_id, 'name',    'Name',    'text',     '{}', true,  true, 0),
    (clients_entity_id, 'email',   'Email',   'email',    '{}', false, true, 1),
    (clients_entity_id, 'phone',   'Phone',   'phone',    '{}', false, true, 2),
    (clients_entity_id, 'company', 'Company', 'text',     '{}', false, true, 3),
    (clients_entity_id, 'status',  'Status',  'select',   '{"choices": ["Lead", "Active", "Inactive", "Churned"]}', false, true, 4),
    (clients_entity_id, 'notes',   'Notes',   'textarea', '{}', false, true, 5);

  -- Default table view for clients
  insert into public.views (org_id, entity_id, name, view_type, config, is_default, sort_order)
  values (new_org_id, clients_entity_id, 'All Clients', 'table', jsonb_build_object(
    'columns', jsonb_build_array('name', 'email', 'company', 'status', 'phone'),
    'sort', jsonb_build_object('field', 'name', 'direction', 'asc'),
    'filters', '[]'::jsonb
  ), true, 0);

  -- Default board view for clients
  insert into public.views (org_id, entity_id, name, view_type, config, is_default, sort_order)
  values (new_org_id, clients_entity_id, 'Pipeline', 'board', jsonb_build_object(
    'group_by', 'status',
    'card_fields', jsonb_build_array('name', 'company', 'email'),
    'columns', jsonb_build_array('Lead', 'Active', 'Inactive', 'Churned')
  ), false, 1);

  -- ==========================================
  -- SEED: Default dashboard page
  -- ==========================================
  insert into public.pages (org_id, slug, title, layout)
  values (new_org_id, 'dashboard', 'Dashboard', jsonb_build_array(
    jsonb_build_object(
      'id', 'kpi-1',
      'type', 'kpi-card',
      'props', jsonb_build_object('title', 'Total Clients', 'entity', 'clients', 'metric', 'count'),
      'position', jsonb_build_object('x', 0, 'y', 0, 'w', 3, 'h', 1)
    ),
    jsonb_build_object(
      'id', 'kpi-2',
      'type', 'kpi-card',
      'props', jsonb_build_object('title', 'Active Clients', 'entity', 'clients', 'metric', 'count', 'filter', jsonb_build_object('field', 'status', 'value', 'Active')),
      'position', jsonb_build_object('x', 3, 'y', 0, 'w', 3, 'h', 1)
    ),
    jsonb_build_object(
      'id', 'kpi-3',
      'type', 'kpi-card',
      'props', jsonb_build_object('title', 'New Leads', 'entity', 'clients', 'metric', 'count', 'filter', jsonb_build_object('field', 'status', 'value', 'Lead')),
      'position', jsonb_build_object('x', 6, 'y', 0, 'w', 3, 'h', 1)
    ),
    jsonb_build_object(
      'id', 'kpi-4',
      'type', 'kpi-card',
      'props', jsonb_build_object('title', 'Churned', 'entity', 'clients', 'metric', 'count', 'filter', jsonb_build_object('field', 'status', 'value', 'Churned')),
      'position', jsonb_build_object('x', 9, 'y', 0, 'w', 3, 'h', 1)
    ),
    jsonb_build_object(
      'id', 'activity-1',
      'type', 'activity-feed',
      'props', jsonb_build_object('title', 'Recent Activity', 'limit', 10),
      'position', jsonb_build_object('x', 0, 'y', 1, 'w', 12, 'h', 2)
    )
  ));

  -- ==========================================
  -- SEED: Default theme
  -- ==========================================
  insert into public.themes (org_id, variables)
  values (new_org_id, jsonb_build_object(
    'bg', '#0B0B0B',
    'bg-elevated', '#131110',
    'bg-card', '#1A1816',
    'text', '#E8E0D4',
    'text-muted', '#8A817A',
    'text-dim', '#5A534D',
    'accent', '#D4734E',
    'accent-hover', '#E8845D',
    'border', '#2A2520'
  ));

  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- UPDATED_AT TRIGGER
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

create trigger update_entity_records_updated_at
  before update on public.entity_records
  for each row execute function public.update_updated_at();

create trigger update_pages_updated_at
  before update on public.pages
  for each row execute function public.update_updated_at();

create trigger update_themes_updated_at
  before update on public.themes
  for each row execute function public.update_updated_at();

create trigger update_ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function public.update_updated_at();
