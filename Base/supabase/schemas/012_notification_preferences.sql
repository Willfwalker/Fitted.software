-- ============================================
-- 012: Notification Preferences
-- ============================================

create table if not exists notification_preferences (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  enabled     boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  unique (org_id, user_id, category)
);

alter table notification_preferences enable row level security;

-- Users can read their own preferences
create policy "Users can view own notification preferences"
  on notification_preferences for select
  using (user_id = auth.uid());

-- Users can insert their own preferences
create policy "Users can insert own notification preferences"
  on notification_preferences for insert
  with check (user_id = auth.uid());

-- Users can update their own preferences
create policy "Users can update own notification preferences"
  on notification_preferences for update
  using (user_id = auth.uid());

-- Auto-update updated_at
create trigger set_notification_preferences_updated_at
  before update on notification_preferences
  for each row execute function update_updated_at();
