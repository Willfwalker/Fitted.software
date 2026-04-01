-- ============================================
-- 007: File Storage & Document Management
-- ============================================

-- ----------------------------------------
-- Tables
-- ----------------------------------------

create table if not exists public.files (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  original_name text not null,
  mime_type    text not null,
  size_bytes   bigint not null default 0,
  storage_path text not null,
  folder       text not null default '/',
  metadata     jsonb default '{}'::jsonb,
  created_by   uuid not null references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.entity_files (
  id          uuid primary key default gen_random_uuid(),
  file_id     uuid not null references public.files(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact', 'company', 'deal', 'invoice', 'task', 'event', 'form_submission')),
  entity_id   uuid not null,
  org_id      uuid not null references public.organizations(id) on delete cascade,
  created_by  uuid not null references auth.users(id),
  created_at  timestamptz not null default now(),
  unique(file_id, entity_type, entity_id)
);

-- ----------------------------------------
-- Activity type extensions
-- ----------------------------------------

alter type public.activity_type add value if not exists 'FILE_UPLOADED';

-- ----------------------------------------
-- Indexes
-- ----------------------------------------

create index if not exists idx_files_org on public.files(org_id);
create index if not exists idx_files_org_folder on public.files(org_id, folder);
create index if not exists idx_files_created_by on public.files(created_by);
create index if not exists idx_files_created_at on public.files(created_at desc);
create index if not exists idx_entity_files_file on public.entity_files(file_id);
create index if not exists idx_entity_files_entity on public.entity_files(entity_type, entity_id);
create index if not exists idx_entity_files_org on public.entity_files(org_id);

-- ----------------------------------------
-- Triggers
-- ----------------------------------------

create trigger set_files_updated_at
  before update on public.files
  for each row execute function public.update_updated_at();

-- ----------------------------------------
-- RLS
-- ----------------------------------------

alter table public.files enable row level security;
alter table public.entity_files enable row level security;

-- files: select for org members
create policy "files_select" on public.files
  for select using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- files: insert for org members
create policy "files_insert" on public.files
  for insert with check (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- files: update for org members
create policy "files_update" on public.files
  for update using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- files: delete for org members
create policy "files_delete" on public.files
  for delete using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- entity_files: select for org members
create policy "entity_files_select" on public.entity_files
  for select using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- entity_files: insert for org members
create policy "entity_files_insert" on public.entity_files
  for insert with check (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- entity_files: delete for org members
create policy "entity_files_delete" on public.entity_files
  for delete using (
    org_id in (select org_id from public.organization_members where user_id = auth.uid())
  );

-- ----------------------------------------
-- Storage bucket policies (org-files)
-- ----------------------------------------

create policy "org_files_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] in (
      select o.id::text from public.organizations o
      join public.organization_members om on om.org_id = o.id
      where om.user_id = auth.uid()
    )
  );

create policy "org_files_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] in (
      select o.id::text from public.organizations o
      join public.organization_members om on om.org_id = o.id
      where om.user_id = auth.uid()
    )
  );

create policy "org_files_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] in (
      select o.id::text from public.organizations o
      join public.organization_members om on om.org_id = o.id
      where om.user_id = auth.uid()
    )
  );

create policy "org_files_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'org-files'
    and (storage.foldername(name))[1] in (
      select o.id::text from public.organizations o
      join public.organization_members om on om.org_id = o.id
      where om.user_id = auth.uid()
    )
  );
