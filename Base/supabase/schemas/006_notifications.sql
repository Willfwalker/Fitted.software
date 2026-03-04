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
