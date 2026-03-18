-- ============================================
-- 020: User Profiles
-- ============================================

create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  avatar_url  text,
  bio         text,
  job_title   text,
  phone       text,
  location    text,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (org_id, user_id)
);

alter table profiles enable row level security;

-- Users can view profiles in their org
create policy "Org members can view profiles"
  on profiles for select
  using (
    org_id in (
      select org_id from organization_members where user_id = auth.uid()
    )
  );

-- Users can insert their own profile
create policy "Users can insert own profile"
  on profiles for insert
  with check (user_id = auth.uid());

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (user_id = auth.uid());

-- Auto-update updated_at
create trigger set_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read avatars (public bucket)
create policy "Public avatar access"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated users can upload their own avatar
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- Users can update their own avatar
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- Users can delete their own avatar
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );
