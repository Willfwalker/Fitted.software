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
