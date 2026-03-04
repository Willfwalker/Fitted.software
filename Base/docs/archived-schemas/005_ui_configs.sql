-- ============================================
-- 005: UI Configs (Custom Fields via AI)
-- ============================================

-- ui_configs: one row per org per entity type
create table public.ui_configs (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('contacts','companies','deals')),
  config      jsonb not null default '{"fields":[]}'::jsonb,
  updated_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(org_id, entity_type)
);

-- RLS
alter table public.ui_configs enable row level security;

-- All org members can read
create policy "ui_configs_select" on public.ui_configs
  for select using (
    org_id in (
      select om.org_id from public.organization_members om
      where om.user_id = auth.uid()
    )
  );

-- OWNER and ADMIN can insert
create policy "ui_configs_insert" on public.ui_configs
  for insert with check (
    org_id in (
      select om.org_id from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('OWNER', 'ADMIN')
    )
  );

-- OWNER and ADMIN can update
create policy "ui_configs_update" on public.ui_configs
  for update using (
    org_id in (
      select om.org_id from public.organization_members om
      where om.user_id = auth.uid()
        and om.role in ('OWNER', 'ADMIN')
    )
  );

-- Add metadata JSONB column to CRM tables
alter table public.contacts add column if not exists metadata jsonb default null;
alter table public.companies add column if not exists metadata jsonb default null;
alter table public.deals add column if not exists metadata jsonb default null;
