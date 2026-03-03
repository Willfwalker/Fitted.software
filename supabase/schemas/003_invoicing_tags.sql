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
