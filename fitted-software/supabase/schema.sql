-- Fitted Software — Provisioning database schema
-- Run this in the Fitted Software Supabase project's SQL editor

create table provisioned_clients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  business_name text not null,
  contact_email text,
  status text not null default 'pending',
    -- pending | provisioning | active | failed | rolled_back
  config jsonb not null default '{}',
  github_repo text,
  supabase_ref text,
  supabase_url text,
  vercel_project_id text,
  vercel_url text,
  provision_log jsonb default '[]',
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Index for quick lookups
create index idx_provisioned_clients_slug on provisioned_clients(slug);
create index idx_provisioned_clients_status on provisioned_clients(status);

-- RLS: only service role can access (admin app uses service key)
alter table provisioned_clients enable row level security;
