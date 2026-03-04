-- ============================================
-- Tasks/Workflow Migration — Run AFTER 004_pdf_email_recurring.sql
-- ============================================

-- Enums
create type public.task_priority as enum ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'URGENT');
create type public.task_status as enum ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED');

-- Extend activity_type with task events
alter type public.activity_type add value 'TASK_CREATED';
alter type public.activity_type add value 'TASK_STATUS_CHANGED';
alter type public.activity_type add value 'TASK_ASSIGNED';

-- Boards (pipeline containers)
create table public.boards (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  description   text,
  archived      boolean not null default false,
  metadata      jsonb,
  created_by    uuid not null references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_boards_org on public.boards(org_id);

create trigger boards_updated_at
  before update on public.boards
  for each row execute function public.update_updated_at();

-- Board Columns (stages with position + optional WIP limit)
create table public.board_columns (
  id            uuid primary key default gen_random_uuid(),
  board_id      uuid not null references public.boards(id) on delete cascade,
  name          text not null,
  position      integer not null default 0,
  wip_limit     integer,
  color         text,
  metadata      jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index idx_board_columns_board on public.board_columns(board_id);
create index idx_board_columns_position on public.board_columns(board_id, position);

create trigger board_columns_updated_at
  before update on public.board_columns
  for each row execute function public.update_updated_at();

-- Labels (org-scoped)
create table public.labels (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references public.organizations(id) on delete cascade,
  name          text not null,
  color         text not null default '#8A817A',
  created_at    timestamptz default now()
);

create index idx_labels_org on public.labels(org_id);

-- Tasks (cards)
create table public.tasks (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references public.organizations(id) on delete cascade,
  board_id          uuid not null references public.boards(id) on delete cascade,
  column_id         uuid not null references public.board_columns(id) on delete cascade,
  title             text not null,
  description       text,
  priority          public.task_priority not null default 'NONE',
  status            public.task_status not null default 'TODO',
  due_date          date,
  assigned_to       uuid references auth.users(id) on delete set null,
  contact_id        uuid references public.contacts(id) on delete set null,
  company_id        uuid references public.companies(id) on delete set null,
  deal_id           uuid references public.deals(id) on delete set null,
  position          integer not null default 0,
  metadata          jsonb,
  created_by        uuid not null references auth.users(id) on delete set null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index idx_tasks_org on public.tasks(org_id);
create index idx_tasks_board on public.tasks(board_id);
create index idx_tasks_column_position on public.tasks(column_id, position);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_contact on public.tasks(contact_id);
create index idx_tasks_company on public.tasks(company_id);
create index idx_tasks_deal on public.tasks(deal_id);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_updated_at();

-- Task Labels (many-to-many)
create table public.task_labels (
  id            uuid primary key default gen_random_uuid(),
  task_id       uuid not null references public.tasks(id) on delete cascade,
  label_id      uuid not null references public.labels(id) on delete cascade,
  created_at    timestamptz default now(),
  unique(task_id, label_id)
);

create index idx_task_labels_task on public.task_labels(task_id);
create index idx_task_labels_label on public.task_labels(label_id);

-- RLS
alter table public.boards enable row level security;
alter table public.board_columns enable row level security;
alter table public.labels enable row level security;
alter table public.tasks enable row level security;
alter table public.task_labels enable row level security;

-- Boards RLS
create policy "Org members can view boards"
  on public.boards for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create boards"
  on public.boards for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update boards"
  on public.boards for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete boards"
  on public.boards for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Board Columns RLS (via board's org)
create policy "Org members can view board columns"
  on public.board_columns for select
  using (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can create board columns"
  on public.board_columns for insert
  with check (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can update board columns"
  on public.board_columns for update
  using (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can delete board columns"
  on public.board_columns for delete
  using (board_id in (
    select id from public.boards where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

-- Labels RLS
create policy "Org members can view labels"
  on public.labels for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create labels"
  on public.labels for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update labels"
  on public.labels for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can delete labels"
  on public.labels for delete
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

-- Tasks RLS
create policy "Org members can view tasks"
  on public.tasks for select
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can create tasks"
  on public.tasks for insert
  with check (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Org members can update tasks"
  on public.tasks for update
  using (org_id in (select org_id from public.organization_members where user_id = auth.uid()));

create policy "Owners and admins can delete tasks"
  on public.tasks for delete
  using (org_id in (
    select org_id from public.organization_members
    where user_id = auth.uid() and role in ('OWNER', 'ADMIN')
  ));

-- Task Labels RLS (via task's org)
create policy "Org members can view task labels"
  on public.task_labels for select
  using (task_id in (
    select id from public.tasks where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can manage task labels"
  on public.task_labels for insert
  with check (task_id in (
    select id from public.tasks where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));

create policy "Org members can remove task labels"
  on public.task_labels for delete
  using (task_id in (
    select id from public.tasks where org_id in (
      select org_id from public.organization_members where user_id = auth.uid()
    )
  ));
