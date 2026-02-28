-- ============================================
-- 008: AI-Native Workspace System
-- Tables for dynamic pages, blocks, AI chat, and audit logging
-- Run this in the Supabase SQL Editor
-- ============================================

-- ============================================
-- Workspace Pages — user-created pages
-- ============================================
create table public.workspace_pages (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  slug        text not null,
  title       text not null,
  icon        text not null default 'LayoutDashboard',
  description text,
  layout      jsonb not null default '{"columns": 4, "gap": 16}'::jsonb,
  sort_order  integer not null default 0,
  is_default  boolean not null default false,
  is_pinned   boolean not null default false,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(org_id, slug)
);

create index idx_workspace_pages_org on public.workspace_pages(org_id);
create index idx_workspace_pages_org_sort on public.workspace_pages(org_id, sort_order);

create trigger workspace_pages_updated_at
  before update on public.workspace_pages
  for each row execute function public.update_updated_at();

-- ============================================
-- Workspace Blocks — blocks on pages
-- ============================================
create table public.workspace_blocks (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.workspace_pages(id) on delete cascade,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  block_type  text not null,
  config      jsonb not null default '{}'::jsonb,
  position    integer not null default 0,
  col_span    integer not null default 1 check (col_span between 1 and 4),
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_workspace_blocks_page on public.workspace_blocks(page_id);
create index idx_workspace_blocks_org on public.workspace_blocks(org_id);
create index idx_workspace_blocks_page_pos on public.workspace_blocks(page_id, position);

create trigger workspace_blocks_updated_at
  before update on public.workspace_blocks
  for each row execute function public.update_updated_at();

-- ============================================
-- AI Conversations
-- ============================================
create table public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null default 'New Conversation',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index idx_ai_conversations_org on public.ai_conversations(org_id);
create index idx_ai_conversations_user on public.ai_conversations(user_id);

create trigger ai_conversations_updated_at
  before update on public.ai_conversations
  for each row execute function public.update_updated_at();

-- ============================================
-- AI Messages
-- ============================================
create table public.ai_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system', 'tool')),
  content         text,
  tool_calls      jsonb,
  tool_results    jsonb,
  created_at      timestamptz default now()
);

create index idx_ai_messages_conversation on public.ai_messages(conversation_id, created_at);

-- ============================================
-- AI Actions — audit log for AI mutations (enables undo)
-- ============================================
create table public.ai_actions (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.ai_conversations(id) on delete set null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  action_type     text not null,
  target_table    text not null,
  target_id       uuid,
  before_state    jsonb,
  after_state     jsonb,
  description     text,
  is_undone       boolean not null default false,
  created_at      timestamptz default now()
);

create index idx_ai_actions_org on public.ai_actions(org_id);
create index idx_ai_actions_conversation on public.ai_actions(conversation_id);
create index idx_ai_actions_target on public.ai_actions(target_table, target_id);

-- ============================================
-- Row Level Security
-- ============================================

alter table public.workspace_pages enable row level security;
alter table public.workspace_blocks enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_actions enable row level security;

-- Workspace Pages RLS
create policy "Org members can view workspace pages"
  on public.workspace_pages for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create workspace pages"
  on public.workspace_pages for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update workspace pages"
  on public.workspace_pages for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete workspace pages"
  on public.workspace_pages for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Workspace Blocks RLS
create policy "Org members can view workspace blocks"
  on public.workspace_blocks for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create workspace blocks"
  on public.workspace_blocks for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update workspace blocks"
  on public.workspace_blocks for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete workspace blocks"
  on public.workspace_blocks for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- AI Conversations RLS (user can only see their own conversations within org)
create policy "Users can view their org conversations"
  on public.ai_conversations for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Users can create conversations"
  on public.ai_conversations for insert
  with check (
    user_id = auth.uid() and
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

create policy "Users can update their conversations"
  on public.ai_conversations for update
  using (user_id = auth.uid());

create policy "Users can delete their conversations"
  on public.ai_conversations for delete
  using (user_id = auth.uid());

-- AI Messages RLS (via conversation ownership)
create policy "Users can view messages in their org conversations"
  on public.ai_messages for select
  using (conversation_id in (
    select id from public.ai_conversations
    where org_id in (select org_id from public.organization_members where user_id = auth.uid())
  ));

create policy "Users can create messages in their conversations"
  on public.ai_messages for insert
  with check (conversation_id in (
    select id from public.ai_conversations where user_id = auth.uid()
  ));

-- AI Actions RLS
create policy "Org members can view ai actions"
  on public.ai_actions for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create ai actions"
  on public.ai_actions for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update ai actions"
  on public.ai_actions for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

-- ============================================
-- Seed default Dashboard page per org (trigger)
-- ============================================
create or replace function public.seed_default_workspace_page()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  new_page_id uuid;
begin
  -- Create default "Dashboard" workspace page
  insert into public.workspace_pages (org_id, slug, title, icon, description, sort_order, is_default, created_by)
  values (new.id, 'home', 'Dashboard', 'LayoutDashboard', 'Your agency overview', 0, true, new.owner_id)
  returning id into new_page_id;

  -- Seed blocks replicating the current hardcoded dashboard
  -- Stat cards row
  insert into public.workspace_blocks (page_id, org_id, block_type, config, position, col_span, created_by) values
    (new_page_id, new.id, 'stat-card', '{"title": "Contacts", "data_source": "contacts", "aggregate": "count", "icon": "Users", "subtitle_source": "companies", "subtitle_aggregate": "count", "subtitle_template": "{value} companies"}'::jsonb, 0, 1, new.owner_id),
    (new_page_id, new.id, 'stat-card', '{"title": "Active Deals", "data_source": "deals", "aggregate": "count", "icon": "FolderOpen", "filter": {"stage_not_in": ["WON", "LOST"]}, "subtitle_source": "deals", "subtitle_aggregate": "sum", "subtitle_field": "value", "subtitle_filter": {"stage_not_in": ["WON", "LOST"]}, "subtitle_template": "${value} in pipeline"}'::jsonb, 1, 1, new.owner_id),
    (new_page_id, new.id, 'stat-card', '{"title": "Pipeline Value", "data_source": "deals", "aggregate": "sum", "aggregate_field": "value", "icon": "DollarSign", "filter": {"stage": "WON"}, "format": "currency", "subtitle": "Won deals"}'::jsonb, 2, 1, new.owner_id),
    (new_page_id, new.id, 'stat-card', '{"title": "Companies", "data_source": "companies", "aggregate": "count", "icon": "Building2", "subtitle_source": "contacts", "subtitle_aggregate": "count", "subtitle_template": "{value} contacts total"}'::jsonb, 3, 1, new.owner_id);

  -- Quick actions
  insert into public.workspace_blocks (page_id, org_id, block_type, config, position, col_span, created_by) values
    (new_page_id, new.id, 'quick-actions', '{"actions": [{"label": "New Contact", "icon": "UserPlus", "href": "/dashboard/crm/contacts?create=true"}, {"label": "New Deal", "icon": "Briefcase", "href": "/dashboard/crm/deals?create=true"}, {"label": "New Company", "icon": "Building2", "href": "/dashboard/crm/companies?create=true"}]}'::jsonb, 4, 4, new.owner_id);

  -- Revenue chart + Activity feed side by side
  insert into public.workspace_blocks (page_id, org_id, block_type, config, position, col_span, created_by) values
    (new_page_id, new.id, 'chart-area', '{"title": "Revenue Overview", "subtitle": "Last 6 months", "data_source": "deals", "x_field": "closed_at", "y_field": "value", "y_aggregate": "sum", "filter": {"stage": "WON"}, "time_bucket": "month", "time_range": 6}'::jsonb, 5, 3, new.owner_id),
    (new_page_id, new.id, 'activity-feed', '{"title": "Recent Activity", "limit": 8}'::jsonb, 6, 1, new.owner_id);

  -- Team list
  insert into public.workspace_blocks (page_id, org_id, block_type, config, position, col_span, created_by) values
    (new_page_id, new.id, 'team-list', '{"title": "Your Team", "show_role": true}'::jsonb, 7, 4, new.owner_id);

  return new;
end;
$$;

create trigger on_organization_created_seed_workspace
  after insert on public.organizations
  for each row execute function public.seed_default_workspace_page();
