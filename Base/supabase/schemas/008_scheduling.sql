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
