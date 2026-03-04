# Fitted Agency — Add Missing Base Modules

## Context

Fitted Agency is an AI-powered agency-in-a-box where each customer gets a copy of a base application, and an AI agent (Python FastAPI service invoking Claude Code CLI) customizes the actual source code per customer. The base currently has 5 modules (Auth, CRM, Invoicing, Dashboard, Reports) with consistent patterns. 5 more modules are needed to cover the full SMB toolkit. The config-driven JSON layout system is being removed in favor of direct code that the AI modifies.

The existing patterns are well-established and must be followed exactly — the AI agent's reliability depends on boring, repetitive code structure across all modules.

---

## Build Order

1. **Task/Workflow Management** — Fills the disabled "Projects" nav placeholder; kanban pattern already exists in DealsPipeline to reference
2. **Notifications (Infrastructure)** — Thin layer that every module emits into. Ships early so Phases 3-6 can wire into it immediately
3. **File Storage & Document Management** — Infrastructure-level; enables attachments across all modules
4. **Scheduling & Calendar** — Standalone module linking to CRM entities
5. **Messaging & Templates** — Email send/history + reusable templates. Builds on existing Resend infrastructure
6. **Forms & Data Capture** — Most self-contained; follows the public invoice share pattern

New dependency: `@schedule-x/react`, `@schedule-x/calendar`, `@schedule-x/events-service`, `@schedule-x/drag-and-drop`, `@schedule-x/theme-default`, `temporal-polyfill` (Phase 4 only). All other phases require zero new dependencies.

---

## Phase 0: Codebase Manifest (Build First)

The AI agent discovers modules by running Claude Code CLI, which reads `CLAUDE.md` and searches the codebase. But with 82+ new files, the agent needs a machine-readable map to navigate confidently without burning tool calls on exploration.

**File: `Base/MODULES.md`** — A structured index that updates as modules are added:

```markdown
# Module Registry

## Pattern Reference
- Server action template: lib/actions/companies.ts
- Zod validation template: lib/validations/crm.ts
- Type definition template: lib/types/crm.ts
- Server page template: app/(dashboard)/dashboard/crm/companies/page.tsx
- Client list template: components/crm/CompanyList.tsx
- Client form template: components/crm/CompanyForm.tsx
- Kanban template: components/crm/DealsPipeline.tsx
- Public share template: app/(public)/invoice/[token]/page.tsx

## Modules

### CRM
- Schema: supabase/schemas/002_crm.sql
- Types: lib/types/crm.ts
- Validation: lib/validations/crm.ts
- Actions: lib/actions/companies.ts, lib/actions/contacts.ts, lib/actions/deals.ts, lib/actions/activities.ts
- Pages: app/(dashboard)/dashboard/crm/
- Components: components/crm/
- Entities: companies, contacts, deals, activities

### Invoicing
- Schema: supabase/schemas/003_invoicing_tags.sql, supabase/schemas/004_pdf_email_recurring.sql
- Types: lib/types/crm.ts (shared)
- Validation: lib/validations/crm.ts (shared)
- Actions: lib/actions/invoices.ts, lib/actions/recurring.ts
- Pages: app/(dashboard)/dashboard/invoicing/
- Components: components/invoicing/
- Public: app/(public)/invoice/[token]/
- API: app/api/invoices/
- Entities: invoices, invoice_line_items, recurring_invoices, invoice_share_tokens

(... same block for each new module, added as they're built ...)
```

**File: `Base/CLAUDE.md`** — Append a section pointing to MODULES.md:

```markdown
## Module Navigation
Before modifying or adding to any module, read MODULES.md for the full registry.
Each module follows identical structure. Find the nearest neighbor in MODULES.md, read those files, then build to match.
```

**Why this matters:** The agent's system-prompt.md already enforces "search first, find nearest neighbor." MODULES.md gives it the answer in one read instead of 3-5 exploratory tool calls. This scales as modules grow — every new module just adds a block to the registry.

**Maintenance rule:** Every phase ends by updating MODULES.md with the new module's entry.

---

## Phase 1: Task/Workflow Management

**Database** — `Base/supabase/schemas/005_tasks.sql`
- Enums: `task_priority` (NONE/LOW/MEDIUM/HIGH/URGENT), `task_status` (TODO/IN_PROGRESS/IN_REVIEW/DONE/CANCELLED)
- Tables: `boards` (pipeline containers), `board_columns` (stages with position + optional WIP limit), `tasks` (cards with priority, due_date, assigned_to, links to contact/company/deal), `labels` (org-scoped, many-to-many via `task_labels`)
- Standard columns: id, org_id, created_by, created_at, updated_at, metadata jsonb
- Activity type extensions: TASK_CREATED, TASK_STATUS_CHANGED, TASK_ASSIGNED

**Types** — `Base/lib/types/tasks.ts`
- Interfaces: Board, BoardColumn, Task, Label
- Display configs: TASK_PRIORITIES, TASK_STATUSES with value/label/color arrays

**Validation** — `Base/lib/validations/tasks.ts`
- Schemas: boardSchema, boardColumnSchema, taskSchema, labelSchema

**Server Actions**
- `Base/lib/actions/boards.ts` — createBoard, updateBoard, deleteBoard, archiveBoard
- `Base/lib/actions/tasks.ts` — createTask, updateTask, moveTask, deleteTask, assignTask
- `Base/lib/actions/labels.ts` — createLabel, updateLabel, deleteLabel, add/remove from task

**Pages**
- `Base/app/(dashboard)/dashboard/tasks/page.tsx` — Board list (server component)
- `Base/app/(dashboard)/dashboard/tasks/[boardId]/page.tsx` — Kanban board view
- Loading skeletons for both

**Components** — `Base/components/tasks/`
- BoardList.tsx — Grid of board cards
- BoardForm.tsx — Create/edit board dialog
- KanbanBoard.tsx — Columns + cards layout (mirror DealsPipeline.tsx pattern)
- KanbanColumn.tsx — Single column (mirror PipelineColumn.tsx)
- TaskCard.tsx — Card in column
- TaskForm.tsx — Create/edit task dialog
- TaskDetailSheet.tsx — Side sheet for full task details
- LabelBadge.tsx, LabelManager.tsx — Label display and CRUD

**Integration**
- Nav: Enable "Projects" in DashboardNav.tsx + MobileNav.tsx → `/dashboard/tasks`
- Search: Add tasks to globalSearch() in `lib/actions/search.ts`
- Activities: Add new activity types to crm.ts configs
- CRM: Tasks link to contacts/companies/deals via FK columns

**Reference files to pattern-match:**
- `Base/components/crm/DealsPipeline.tsx` — kanban pattern
- `Base/components/crm/PipelineColumn.tsx` — column pattern
- `Base/lib/actions/deals.ts` — server action pattern with stage changes

---

## Phase 2: Notifications (Infrastructure Layer)

Notifications are infrastructure, not a feature module. Every module needs to emit notifications (task assigned, form submitted, event created, invoice paid). Shipping this early means Phases 3-6 can wire in immediately instead of retrofitting.

**Database** — `Base/supabase/schemas/005_notifications.sql`
- Enum: `notification_status` (UNREAD/READ/ARCHIVED)
- Table: `notifications` (user_id, org_id, title, body, link, icon, status, source_type, source_id, created_at)
  - `source_type` + `source_id`: polymorphic reference to what triggered it (task, event, form, message, etc.)
  - `link`: in-app route to navigate to on click (e.g. `/dashboard/tasks/board-id`)
  - `icon`: lucide icon name for display context
- Standard columns: id, org_id, created_at (no updated_at — notifications are append-only, status is the only mutable field)
- Indexes: `idx_notifications_user_status` on (user_id, status), `idx_notifications_org` on (org_id)
- RLS: select/update scoped to `user_id = auth.uid()`, insert for any org member, delete for the notification owner

**Types** — `Base/lib/types/notifications.ts`
- Interface: Notification
- NotificationStatus enum
- `NOTIFICATION_ICONS` config mapping source_type to lucide icon names

**Validation** — `Base/lib/validations/notifications.ts`
- createNotificationSchema (for internal use by other modules)

**Server Actions** — `Base/lib/actions/notifications.ts`
- `createNotification(params)` — NOT a form action. Called by other server actions internally. Takes `{ userId, orgId, title, body, link, icon, sourceType, sourceId }`
- `markAsRead(id)` — Set status to READ
- `markAllAsRead()` — Mark all for current user
- `getUnreadCount()` — Returns number for badge
- `getNotifications(limit, offset)` — Paginated list for panel

**No pages** — Notifications don't have their own route. They live in the header.

**Components** — `Base/components/notifications/`
- NotificationBell.tsx — Bell icon in DashboardHeader with unread count badge. Polls `getUnreadCount()` on interval or uses Supabase realtime subscription
- NotificationPanel.tsx — Dropdown panel listing recent notifications, grouped by time, with mark-as-read and "mark all read" actions
- NotificationItem.tsx — Single notification row with icon, title, body, timestamp, read/unread state

**Integration**
- DashboardHeader.tsx: Add `<NotificationBell />` — this is the only UI integration point
- Every future module calls `createNotification()` from its own server actions when relevant events occur
- Existing modules can optionally wire in too (e.g. deal stage change, invoice sent)

**Reference files:**
- `Base/lib/actions/activities.ts` — pattern for an internal logging function called by other actions
- `Base/components/dashboard/DashboardHeader.tsx` — where NotificationBell gets added

---

## Phase 3: File Storage & Document Management (was Phase 2)

**Database** — `Base/supabase/schemas/006_files.sql`
- Tables: `files` (name, original_name, mime_type, size_bytes, storage_path, folder), `entity_files` (polymorphic junction: file_id + entity_type + entity_id)
- entity_type check constraint: contact, company, deal, invoice, task, event, form_submission
- Activity type: FILE_UPLOADED

**Supabase Storage** — Create `org-files` bucket with RLS. Path format: `{org_id}/{folder}/{uuid}_{filename}`

**Types** — `Base/lib/types/files.ts`
**Validation** — `Base/lib/validations/files.ts`

**Server Actions** — `Base/lib/actions/files.ts`
- uploadFile, deleteFile, moveFile, attachToEntity, detachFromEntity, listEntityFiles

**API Routes** (server actions can't handle multipart uploads)
- `Base/app/api/files/upload/route.ts` — POST multipart upload to Supabase Storage + insert metadata
- `Base/app/api/files/[id]/download/route.ts` — Generate signed download URL

**Pages**
- `Base/app/(dashboard)/dashboard/files/page.tsx` — File browser
- Loading skeleton

**Components** — `Base/components/files/`
- FileBrowser.tsx — Grid/list view with folder navigation
- FileUploadZone.tsx — Drag-and-drop upload area
- FileCard.tsx — File preview card (icon by mime type)
- EntityFileAttacher.tsx — **Reusable component** dropped into any entity detail page
- FilePreviewModal.tsx — Preview images/PDFs inline

**Integration**
- Drop `<EntityFileAttacher>` into contact detail, deal detail, task detail, invoice detail pages
- No new nav item needed — files accessible from entity pages + optional `/dashboard/files` browser

**Reference files:**
- `Base/lib/actions/invoices.ts` — Supabase client pattern for file operations
- Supabase Storage docs for `supabase.storage.from('bucket').upload()`

---

## Phase 4: Scheduling & Calendar

**Library: [Schedule-X](https://schedule-x.dev/)** — Modern React calendar with built-in dark mode, Next.js hook (`useNextCalendarApp`), drag-and-drop plugin, no moment.js dependency, and CSS variable theming.

**Install:** `npm install @schedule-x/react @schedule-x/calendar @schedule-x/events-service @schedule-x/drag-and-drop @schedule-x/theme-default temporal-polyfill`

**Database** — `Base/supabase/schemas/007_scheduling.sql`
- Enum: `event_status` (SCHEDULED/COMPLETED/CANCELLED/NO_SHOW)
- Table: `events` (title, description, location, start_time, end_time, all_day, status, color, links to contact/company/deal, assigned_to)
- Indexes on time range for efficient calendar queries
- Activity types: EVENT_CREATED, EVENT_COMPLETED

**Types** — `Base/lib/types/scheduling.ts`
**Validation** — `Base/lib/validations/scheduling.ts`

**Server Actions** — `Base/lib/actions/events.ts`
- createEvent, updateEvent, deleteEvent, updateEventStatus, getEventsInRange

**Pages**
- `Base/app/(dashboard)/dashboard/calendar/page.tsx` — Server component fetches events for visible range, passes to client
- Loading skeleton

**Components** — `Base/components/calendar/`
- CalendarView.tsx — Wraps Schedule-X `ScheduleXCalendar` with `useNextCalendarApp`, configures views (day/week/monthGrid/monthAgenda), sets `isDark: true`, wires `onEventClick`/`onEventUpdate`/`onClickDateTime` callbacks, uses `createEventsServicePlugin` + `createDragAndDropPlugin`
- EventForm.tsx — Create/edit event dialog (same pattern as CompanyForm)
- EventDetailSheet.tsx — Event detail side sheet
- CalendarToolbar.tsx — Custom toolbar wrapper if Schedule-X default needs tweaking for design system

**Schedule-X dark theme override** — Override CSS variables in `globals.css` to match design tokens:
```css
.sx-react-calendar { --sx-color-surface: var(--bg-card); --sx-color-on-surface: var(--text); }
```

**Integration**
- Nav: Enable "Calendar" in DashboardNav.tsx + MobileNav.tsx → `/dashboard/calendar`
- CRM: Contact/company detail pages get "Events" section + "Schedule" button
- Dashboard: Upcoming events widget
- Search: Add events to globalSearch()

**Reference files:**
- `Base/components/crm/CompanyList.tsx` — list/form pattern
- `Base/app/(dashboard)/dashboard/crm/companies/page.tsx` — server component with searchParams
- Schedule-X Next.js docs: `useNextCalendarApp` hook + `ScheduleXCalendar` component

---

## Phase 5: Messaging & Templates

Notifications already shipped in Phase 2. This phase is purely about outbound communications — sending emails, logging message history, and managing reusable templates.

**Database** — `Base/supabase/schemas/008_messaging.sql`
- Enums: `message_channel` (EMAIL/SMS), `message_status` (DRAFT/SENT/DELIVERED/FAILED)
- Tables:
  - `message_templates` (name, subject, body, channel, variables jsonb) — reusable templates with `{{variable}}` placeholders
  - `messages` (channel, status, subject, body, recipient_email, recipient_name, links to contact/company/deal, template_id, sent_at, error_message) — send log
- Activity type: MESSAGE_SENT

**Types** — `Base/lib/types/messaging.ts`
**Validation** — `Base/lib/validations/messaging.ts`

**Server Actions**
- `Base/lib/actions/messages.ts` — sendEmail (reuses Resend pattern from invoice-email.ts), createMessage, getMessageHistory
- `Base/lib/actions/templates.ts` — CRUD + renderTemplate ({{variable}} substitution)
- Sending a message also calls `createNotification()` from Phase 2 to notify the sender of delivery status

**Pages**
- `Base/app/(dashboard)/dashboard/messages/page.tsx` — Message history
- `Base/app/(dashboard)/dashboard/messages/templates/page.tsx` — Template management
- Loading skeletons

**Components** — `Base/components/messages/`
- MessageList.tsx — Message history table
- ComposeMessage.tsx — Send email dialog (template selector + contact picker)
- TemplateList.tsx — Template cards with search
- TemplateForm.tsx — Template editor with variable insertion
- TemplatePreview.tsx — Live preview with variable substitution

**Integration**
- CRM: "Send Message" button on contact/company detail pages
- Invoicing: Can optionally use templates for invoice emails (extending existing `buildInvoiceEmailHtml`)

**Reference files:**
- `Base/lib/email/invoice-email.ts` — Resend email pattern
- `Base/components/invoicing/SendInvoiceModal.tsx` — send email UI pattern

---

## Phase 6: Forms & Data Capture

**Database** — `Base/supabase/schemas/009_forms.sql`
- Enums: `form_status` (DRAFT/ACTIVE/ARCHIVED), `form_field_type` (TEXT/TEXTAREA/EMAIL/PHONE/NUMBER/DATE/SELECT/MULTI_SELECT/CHECKBOX/RADIO/FILE/HIDDEN)
- Tables: `forms` (name, description, slug, status, fields jsonb, settings jsonb, share_token uuid, submission_count), `form_submissions` (form_id, data jsonb, links to contact/company/deal, source_ip, user_agent)
- Public RLS policy on forms for share_token access (mirrors public invoice pattern)
- Activity type: FORM_SUBMITTED

**Field definitions stored as JSONB array:**
```json
[
  { "id": "uuid", "type": "TEXT", "label": "Full Name", "required": true },
  { "id": "uuid", "type": "SELECT", "label": "Interest", "options": ["Sales", "Support"] }
]
```

**Types** — `Base/lib/types/forms.ts`
**Validation** — `Base/lib/validations/forms.ts` — includes dynamicSubmissionValidator that builds Zod schema from field definitions at runtime

**Server Actions**
- `Base/lib/actions/forms.ts` — createForm, updateForm, deleteForm, publishForm, generateShareToken
- `Base/lib/actions/submissions.ts` — submitForm (public), listSubmissions, deleteSubmission, linkToEntity

**API Route** — `Base/app/api/forms/submit/route.ts` — POST for public form submission (no auth, validates share_token + field data)

**Pages**
- `Base/app/(dashboard)/dashboard/forms/page.tsx` — Form list
- `Base/app/(dashboard)/dashboard/forms/[id]/page.tsx` — Form builder/editor
- `Base/app/(dashboard)/dashboard/forms/[id]/submissions/page.tsx` — Submissions list
- `Base/app/(public)/form/[token]/layout.tsx` — Public form layout (mirrors invoice layout)
- `Base/app/(public)/form/[token]/page.tsx` — Public form page
- Loading skeletons

**Components** — `Base/components/forms/`
- FormList.tsx — Form cards grid
- FormBuilder.tsx — Visual field editor (add/remove/reorder fields)
- FormFieldEditor.tsx — Individual field config (type, label, required, options)
- FormPreview.tsx — Live preview of form
- PublicFormView.tsx — Public-facing form renderer (mirrors PublicInvoiceView)
- SubmissionsList.tsx — Submissions data table
- SubmissionDetail.tsx — Individual submission view
- ShareFormButton.tsx — Generate + copy share link (mirrors ShareLinkButton)

**Integration**
- CRM: Submissions can auto-create contacts if email field matches
- Notifications: New submission triggers notification to form owner
- Files: FILE field type uploads via entity_files

**Reference files:**
- `Base/app/(public)/invoice/[token]/page.tsx` — public share pattern
- `Base/components/invoicing/ShareLinkButton.tsx` — share link UI pattern
- `Base/components/invoicing/PublicInvoiceView.tsx` — public view pattern

---

## Cross-Cutting Changes (All Phases)

**Files modified across all phases:**
- `Base/components/dashboard/DashboardNav.tsx` — Add/enable nav items
- `Base/components/dashboard/MobileNav.tsx` — Same nav updates
- `Base/lib/actions/search.ts` — Add new entity types to globalSearch()
- `Base/components/search/CommandKModal.tsx` — Add icons/routes for new types
- `Base/lib/types/crm.ts` — Add activity type enum values + display configs
- `Base/app/(dashboard)/dashboard/page.tsx` — Add dashboard widgets (tasks, events, messages)
- `Base/app/(dashboard)/dashboard/reports/page.tsx` — Add report metrics for new modules

**Final nav state after all phases:**
```
Dashboard  →  /dashboard
CRM        →  /dashboard/crm/contacts
Projects   →  /dashboard/tasks
Calendar   →  /dashboard/calendar
Invoices   →  /dashboard/invoicing
Reports    →  /dashboard/reports
```

Communications + Files accessible from entity detail pages. Forms accessible via dedicated route. AI agent adds nav items per customer as needed.

---

## File Count Summary

| Phase | SQL | Types | Validations | Actions | Pages | Components | Total |
|-------|-----|-------|-------------|---------|-------|------------|-------|
| 0. Manifest | — | — | — | — | — | — | 2 (MODULES.md + CLAUDE.md update) |
| 1. Tasks | 1 | 1 | 1 | 3 | 4 | 9 | 19 |
| 2. Notifications | 1 | 1 | 1 | 1 | 0 | 3 | 7 |
| 3. Files | 1 | 1 | 1 | 1 | 2+2 API | 5 | 13 |
| 4. Calendar | 1 | 1 | 1 | 1 | 2 | 4 | 10 + deps |
| 5. Messaging | 1 | 1 | 1 | 2 | 4 | 5 | 14 |
| 6. Forms | 1 | 1 | 1 | 2 | 5+1 API | 8 | 19 |
| **Total** | **6** | **6** | **6** | **10** | **~20** | **34** | **~84** |

Plus ~8 existing files modified for nav, search, types, dashboard, reports.

---

## Verification: Sub-Phase Landing Order

Each phase is built in layers. Verify the build compiles after each layer before moving to the next. If a schema mistake propagates through 19 files before you catch it, the rework is painful.

**Layer order within every phase:**

### Layer A: Data Foundation
1. Write the SQL schema file
2. Run it in Supabase SQL editor — verify tables, enums, RLS, indexes
3. Write types file (`lib/types/module.ts`)
4. Write validation file (`lib/validations/module.ts`)
5. `npm run build` — must compile

### Layer B: Server Logic
6. Write server actions (`lib/actions/module.ts`)
7. Write any API routes if needed
8. `npm run build` — must compile (actions can import types/validations)

### Layer C: Pages & Components
9. Write the server page component(s) (`app/(dashboard)/dashboard/module/page.tsx`)
10. Write loading skeletons
11. Write client components one at a time (list first, then form, then detail)
12. `npm run build` after each component — catch import/type errors immediately

### Layer D: Integration
13. Update DashboardNav.tsx + MobileNav.tsx
14. Update globalSearch() + CommandKModal
15. Update activity type configs in crm.ts
16. `npm run build` — full compile check

### Layer E: Smoke Test & Manifest
17. Dev server: navigate to new pages, test CRUD (create, list, edit, delete)
18. Verify Cmd+K search finds new entity types
19. Update MODULES.md with new module entry
20. Phase-specific checks:
    - Phase 2: Verify NotificationBell renders in header, create a test notification via action, confirm it appears in panel and unread count updates
    - Phase 3: Upload + download a file via Supabase Storage
    - Phase 4: Verify Schedule-X renders with dark theme, drag events between days
    - Phase 5: Send a test email via Resend, verify message appears in history
    - Phase 6: Generate share link, load public form, submit, verify submission appears + notification fires
