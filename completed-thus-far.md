# Fitted Agency — Build Progress

## Phase 0: Codebase Manifest ✅

**Files created:**
- `Base/MODULES.md` — Machine-readable module registry listing all existing modules (Auth, CRM, Invoicing, Dashboard, Reports, Search, Tags, CSV, Settings) with their schemas, types, actions, pages, and components
- `Base/CLAUDE.md` — Agent conventions guide: tech stack, file structure patterns, server action patterns, component patterns, database conventions, design tokens, and navigation/search integration instructions

---

## Phase 1: Task/Workflow Management ✅

Fills the disabled "Projects" nav placeholder. Full kanban board system with boards, columns, tasks, labels, and CRM entity linking.

### Layer A: Data Foundation
| File | Description |
|------|-------------|
| `supabase/schemas/005_tasks.sql` | 2 enums (`task_priority`, `task_status`), 5 tables (`boards`, `board_columns`, `labels`, `tasks`, `task_labels`), 3 new activity type values, 7 indexes, 3 update triggers, 15 RLS policies |
| `lib/types/tasks.ts` | `Board`, `BoardColumn`, `Task`, `Label`, `TaskLabel` interfaces + `TASK_PRIORITIES`, `TASK_STATUSES`, `DEFAULT_BOARD_COLUMNS` display configs |
| `lib/validations/tasks.ts` | `boardSchema`, `boardColumnSchema`, `taskSchema`, `labelSchema` Zod schemas + inferred form types |

### Layer B: Server Actions
| File | Actions |
|------|---------|
| `lib/actions/boards.ts` | `createBoard` (with default columns), `updateBoard`, `deleteBoard`, `archiveBoard`, `createColumn`, `updateColumn`, `deleteColumn`, `reorderColumns` |
| `lib/actions/tasks.ts` | `createTask`, `updateTask`, `moveTask` (with activity logging on column change), `assignTask` (with activity logging), `deleteTask` |
| `lib/actions/labels.ts` | `createLabel`, `updateLabel`, `deleteLabel`, `addLabelToTask` (with duplicate handling), `removeLabelFromTask` |

### Layer C: Pages & Components
| File | Description |
|------|-------------|
| `app/(dashboard)/dashboard/tasks/page.tsx` | Board list server page with task counts, wrapped in `p-8 lg:p-12` with "Projects / Boards" header |
| `app/(dashboard)/dashboard/tasks/loading.tsx` | Board list loading skeleton |
| `app/(dashboard)/dashboard/tasks/[boardId]/page.tsx` | Kanban board server page — fetches board, columns, tasks (with labels), labels, contacts, companies, deals, org members |
| `app/(dashboard)/dashboard/tasks/[boardId]/loading.tsx` | Kanban board loading skeleton |
| `components/tasks/BoardList.tsx` | Board card grid with create/archive/delete actions, empty state |
| `components/tasks/BoardForm.tsx` | Create/edit board dialog (name + description) |
| `components/tasks/KanbanBoard.tsx` | Kanban layout with drag-and-drop between columns, optimistic updates, task creation per-column |
| `components/tasks/KanbanColumn.tsx` | Single column with header (name, count, WIP limit indicator), drop zone, add task button |
| `components/tasks/TaskCard.tsx` | Draggable task card showing title, priority badge, label color dots, due date (with overdue highlighting), assignee, linked contact |
| `components/tasks/TaskForm.tsx` | Create/edit task dialog — title, description, column, priority, due date, assignee, contact, company, deal selectors |
| `components/tasks/TaskDetailSheet.tsx` | Side sheet showing full task details: status/priority/column badges, labels, description, due date, linked CRM entities, timestamps, edit/delete actions |
| `components/tasks/LabelBadge.tsx` | Colored label pill display |
| `components/tasks/LabelManager.tsx` | Label CRUD with preset color picker |

### Layer D: Integration (existing files modified)
| File | Change |
|------|--------|
| `components/dashboard/DashboardNav.tsx` | "Projects" nav item enabled → `/dashboard/tasks` |
| `components/dashboard/MobileNav.tsx` | Same nav item enabled |
| `components/dashboard/DashboardHeader.tsx` | Added `/dashboard/tasks` → "Projects" page title |
| `lib/actions/search.ts` | Added `task` type to `SearchResult`, added tasks table query to `globalSearch()` |
| `components/search/CommandKModal.tsx` | Added `task` type config with `FolderKanban` icon, updated placeholder text |
| `lib/types/crm.ts` | Added `TASK_CREATED`, `TASK_STATUS_CHANGED`, `TASK_ASSIGNED` to `ActivityType` union + `ACTIVITY_TYPE_CONFIG` |
| `components/crm/ActivityTimeline.tsx` | Added icon/color mappings for 3 new activity types |

### Seed Data
| File | Description |
|------|-------------|
| `supabase/seeds/003_tasks_demo_data.sql` | 6 labels, 2 boards (Pulse Patient Dashboard + Meridian Booking System), 8 columns, 14 tasks across all stages, 17 label assignments, 5 task activities — all linked to existing CRM seed data |

### File Count
- **New files: 19** (1 SQL + 1 types + 1 validation + 3 actions + 4 pages + 9 components + 1 seed)
- **Modified files: 7** (2 nav + 1 header + 1 search action + 1 search modal + 1 types + 1 activity timeline)
- **Manifest files: 2** (MODULES.md + CLAUDE.md)

---

## Phase 2: Notifications (Infrastructure Layer) ✅

Infrastructure layer — every module emits notifications via `createNotification()`. Bell icon in header with popover panel.

### Layer A: Data Foundation
| File | Description |
|------|-------------|
| `supabase/schemas/006_notifications.sql` | 1 enum (`notification_status`), 1 table (`notifications` with polymorphic `source_type` + `source_id`), 3 indexes, 4 RLS policies |
| `lib/types/notifications.ts` | `Notification` interface, `NotificationStatus` type, `NOTIFICATION_ICONS` config mapping source_type to lucide icon names |
| `lib/validations/notifications.ts` | `createNotificationSchema` Zod schema for internal use + `CreateNotificationData` inferred type |

### Layer B: Server Actions
| File | Actions |
|------|---------|
| `lib/actions/notifications.ts` | `createNotification` (internal, not a form action), `markAsRead`, `markAllAsRead`, `getUnreadCount`, `getNotifications` (paginated) |

### Layer C: Components
| File | Description |
|------|-------------|
| `components/notifications/NotificationBell.tsx` | Bell icon with unread count badge, popover trigger, polls every 30s |
| `components/notifications/NotificationPanel.tsx` | Dropdown panel with notification list, "mark all read" button, empty state |
| `components/notifications/NotificationItem.tsx` | Single notification row with icon (mapped from source_type), title, body, timestamp, unread indicator dot, click-to-navigate |

### Layer D: Integration (existing files modified)
| File | Change |
|------|--------|
| `components/dashboard/DashboardHeader.tsx` | Added `<NotificationBell />` to header right side |
| `MODULES.md` | Added Notifications module entry |

### File Count
- **New files: 7** (1 SQL + 1 types + 1 validation + 1 actions + 3 components)
- **Modified files: 2** (1 header + 1 MODULES.md)

---

## Phase 3: File Storage & Document Management ✅

Upload/download files to Supabase Storage, browse files, attach files to any entity (contacts, deals, tasks, invoices, etc.).

### Layer A: Data Foundation
| File | Description |
|------|-------------|
| `supabase/schemas/007_files.sql` | 2 tables (`files` with storage_path/mime_type/size_bytes, `entity_files` polymorphic junction with entity_type check constraint), 1 activity type (`FILE_UPLOADED`), 7 indexes, 1 update trigger, 7 RLS policies |
| `lib/types/files.ts` | `FileRecord`, `EntityFile`, `FileEntityType` interfaces + `FILE_TYPE_ICONS` config, `getFileIcon()`, `formatFileSize()`, `isPreviewable()` utility functions |
| `lib/validations/files.ts` | `fileMetadataSchema`, `moveFileSchema`, `renameFileSchema`, `attachFileSchema` Zod schemas + inferred form types |

### Layer B: Server Actions & API Routes
| File | Actions |
|------|---------|
| `lib/actions/files.ts` | `deleteFile`, `bulkDeleteFiles`, `moveFile`, `renameFile`, `attachToEntity`, `detachFromEntity`, `listEntityFiles`, `listFiles`, `getFolders`, `getDownloadUrl` |
| `app/api/files/upload/route.ts` | POST multipart file upload → Supabase Storage + metadata insert + activity log (50MB limit) |
| `app/api/files/[id]/download/route.ts` | GET signed download URL generation + redirect |

### Layer C: Pages & Components
| File | Description |
|------|-------------|
| `app/(dashboard)/dashboard/files/page.tsx` | File browser server page with search, sort, folder filter |
| `app/(dashboard)/dashboard/files/loading.tsx` | File grid loading skeleton |
| `components/files/FileBrowser.tsx` | Main file browser with grid view, search, sort, folder nav, upload button, bulk delete, rename dialog |
| `components/files/FileCard.tsx` | File card with mime-type icon, name, size, date, selection checkbox, context menu (preview/download/rename/delete) |
| `components/files/FileUploadZone.tsx` | Drag-and-drop upload dialog with multi-file queue, progress tracking, per-file status |
| `components/files/FilePreviewModal.tsx` | Preview modal for images and PDFs with signed URL loading, download button |
| `components/files/EntityFileAttacher.tsx` | **Reusable component** for attaching files to any entity — upload + attach in one action, list attached files, detach/download |

### Layer D: Integration (existing files modified)
| File | Change |
|------|--------|
| `components/dashboard/DashboardNav.tsx` | Added "Files" nav item with `Paperclip` icon → `/dashboard/files` |
| `components/dashboard/MobileNav.tsx` | Same "Files" nav item added |
| `components/dashboard/DashboardHeader.tsx` | Added `/dashboard/files` → "Files" page title |
| `lib/actions/search.ts` | Added `file` type to `SearchResult`, added files table query to `globalSearch()` |
| `components/search/CommandKModal.tsx` | Added `file` type config with `Paperclip` icon, updated placeholder text |
| `lib/types/crm.ts` | Added `FILE_UPLOADED` to `ActivityType` union + `ACTIVITY_TYPE_CONFIG` |
| `components/crm/ActivityTimeline.tsx` | Added `Paperclip` icon/color mapping for `FILE_UPLOADED` activity type |
| `MODULES.md` | Added File Storage module entry |

### File Count
- **New files: 13** (1 SQL + 1 types + 1 validation + 1 actions + 2 API routes + 2 pages + 5 components)
- **Modified files: 8** (2 nav + 1 header + 1 search action + 1 search modal + 1 types + 1 activity timeline + 1 MODULES.md)

---

## Phase 4: Scheduling & Calendar ✅

Schedule-X calendar integration with dark theme, drag-and-drop event rescheduling, multiple views (day/week/month grid/month agenda), and full CRM entity linking.

### Layer A: Data Foundation
| File | Description |
|------|-------------|
| `supabase/schemas/008_scheduling.sql` | 1 enum (`event_status`), 1 table (`calendar_events` with location, color, CRM FKs), 2 activity type extensions (`EVENT_CREATED`, `EVENT_COMPLETED`), 6 indexes, 1 update trigger, 4 RLS policies |
| `lib/types/scheduling.ts` | `CalendarEvent` interface, `EventStatus` type, `EVENT_STATUSES` + `EVENT_COLORS` display configs |
| `lib/validations/scheduling.ts` | `calendarEventSchema` Zod schema + `CalendarEventFormData` inferred type |

### Layer B: Server Actions
| File | Actions |
|------|---------|
| `lib/actions/events.ts` | `createEvent` (with activity logging), `updateEvent`, `updateEventStatus` (with completion activity), `updateEventTime` (for drag-and-drop), `deleteEvent` |

### Layer C: Pages & Components
| File | Description |
|------|-------------|
| `app/(dashboard)/dashboard/calendar/page.tsx` | Calendar server page — fetches events (with CRM joins), contacts, companies, deals, org members |
| `app/(dashboard)/dashboard/calendar/loading.tsx` | Calendar loading skeleton |
| `components/calendar/CalendarView.tsx` | Main calendar wrapper — Schedule-X with `useNextCalendarApp`, 4 views, dark mode (`isDark: true`), drag-and-drop plugin, event click → detail sheet, date click → create form, Temporal polyfill date conversion, custom color categories from event colors |
| `components/calendar/EventForm.tsx` | Create/edit event dialog — title, start/end datetime, all-day checkbox, location, description, status, color picker, assignee, contact/company/deal selectors |
| `components/calendar/EventDetailSheet.tsx` | Event detail side sheet — status badge, quick "Mark Complete"/"Cancel" actions, description, time/location/CRM entity detail cards, edit/delete actions |

### Layer D: Integration (existing files modified)
| File | Change |
|------|--------|
| `components/dashboard/DashboardNav.tsx` | Replaced disabled "Time" placeholder with active "Calendar" nav item (`CalendarDays` icon) → `/dashboard/calendar`. Added explicit type annotation for navItems array |
| `components/dashboard/MobileNav.tsx` | Same Calendar nav item + type annotation |
| `components/dashboard/DashboardHeader.tsx` | Added `/dashboard/calendar` → "Calendar" page title |
| `lib/actions/search.ts` | Added `event` type to `SearchResult`, added `calendar_events` table query to `globalSearch()` |
| `components/search/CommandKModal.tsx` | Added `event` type config with `CalendarDays` icon, updated placeholder text |
| `lib/types/crm.ts` | Added `EVENT_CREATED`, `EVENT_COMPLETED` to `ActivityType` union + `ACTIVITY_TYPE_CONFIG` |
| `components/crm/ActivityTimeline.tsx` | Added `CalendarDays`/`CalendarCheck` icon imports + icon/color mappings for 2 new activity types |
| `app/globals.css` | Added Schedule-X dark theme CSS overrides (`.sx-fitted-calendar` scope) matching design tokens |
| `MODULES.md` | Added Scheduling & Calendar module entry |

### Dependencies Added
- `@schedule-x/react`, `@schedule-x/calendar`, `@schedule-x/events-service`, `@schedule-x/drag-and-drop`, `@schedule-x/theme-default`, `temporal-polyfill`

### File Count
- **New files: 10** (1 SQL + 1 types + 1 validation + 1 actions + 2 pages + 3 components + CSS overrides in globals.css)
- **Modified files: 9** (2 nav + 1 header + 1 search action + 1 search modal + 1 types + 1 activity timeline + 1 globals.css + 1 MODULES.md)

---

## Phase 5: Messaging & Templates ✅

Email send/history via Resend, reusable message templates with `{{variable}}` substitution, contact/template pickers in compose dialog.

### Layer A: Data Foundation
| File | Description |
|------|-------------|
| `supabase/schemas/009_messaging.sql` | 2 enums (`message_channel`, `message_status`), 2 tables (`message_templates` with variables jsonb, `messages` with CRM FKs + template FK), 1 activity type extension (`MESSAGE_SENT`), 8 indexes, 2 update triggers, 8 RLS policies |
| `lib/types/messaging.ts` | `MessageTemplate`, `Message` interfaces, `MessageChannel`/`MessageStatus` types, `MESSAGE_CHANNELS`, `MESSAGE_STATUSES` display configs, `renderTemplate()` pure utility function |
| `lib/validations/messaging.ts` | `messageTemplateSchema`, `composeMessageSchema` Zod schemas + `MessageTemplateFormData`, `ComposeMessageFormData` inferred types |

### Layer B: Server Actions
| File | Actions |
|------|---------|
| `lib/actions/messages.ts` | `sendMessage` (Resend email delivery with activity logging + notification), `deleteMessage`, `getMessageHistory` (paginated with CRM joins) |
| `lib/actions/templates.ts` | `createTemplate` (with auto variable extraction), `updateTemplate`, `deleteTemplate`, `getTemplates` |

### Layer C: Pages & Components
| File | Description |
|------|-------------|
| `app/(dashboard)/dashboard/messages/page.tsx` | Message history server page with search, status filter, contacts + templates for compose dialog |
| `app/(dashboard)/dashboard/messages/loading.tsx` | Message list loading skeleton |
| `app/(dashboard)/dashboard/messages/templates/page.tsx` | Template management server page |
| `app/(dashboard)/dashboard/messages/templates/loading.tsx` | Template grid loading skeleton |
| `components/messages/MessageList.tsx` | Message history table with status tabs (All/Draft/Sent/Delivered/Failed), search, compose button, delete action |
| `components/messages/ComposeMessage.tsx` | Compose email dialog — template selector, contact picker (auto-fills email/name), subject, body, send via Resend |
| `components/messages/TemplateList.tsx` | Template card grid with search, create/edit/delete, click to preview |
| `components/messages/TemplateForm.tsx` | Template create/edit dialog — name, channel, subject, body with `{{variable}}` detection + display |
| `components/messages/TemplatePreview.tsx` | Live template preview with variable input fields for substitution testing |

### Layer D: Integration (existing files modified)
| File | Change |
|------|--------|
| `components/dashboard/DashboardNav.tsx` | Added "Messages" nav item with `MessageSquare` icon → `/dashboard/messages` |
| `components/dashboard/MobileNav.tsx` | Same "Messages" nav item added |
| `components/dashboard/DashboardHeader.tsx` | Added `/dashboard/messages` → "Messages" and `/dashboard/messages/templates` → "Templates" page titles |
| `lib/actions/search.ts` | Added `message` + `template` types to `SearchResult`, added messages + message_templates queries to `globalSearch()` |
| `components/search/CommandKModal.tsx` | Added `message` type with `MessageSquare` icon + `template` type with `FileText` icon, updated placeholder text |
| `lib/types/crm.ts` | Added `MESSAGE_SENT` to `ActivityType` union + `ACTIVITY_TYPE_CONFIG` |
| `components/crm/ActivityTimeline.tsx` | Added `MessageSquare` icon import + icon/color mapping for `MESSAGE_SENT` activity type |
| `MODULES.md` | Added Messaging & Templates module entry |

### File Count
- **New files: 14** (1 SQL + 1 types + 1 validation + 2 actions + 4 pages + 5 components)
- **Modified files: 8** (2 nav + 1 header + 1 search action + 1 search modal + 1 types + 1 activity timeline + 1 MODULES.md)

---

## Phase 6: Forms & Data Capture ✅

Public form builder with visual field editor, share via token, public form rendering, submission collection with notifications.

### Layer A: Data Foundation
| File | Description |
|------|-------------|
| `supabase/schemas/010_forms.sql` | 2 enums (`form_status`, `form_field_type`), 2 tables (`forms` with fields/settings JSONB + share_token, `form_submissions` with polymorphic CRM links), 1 activity type extension (`FORM_SUBMITTED`), 8 indexes, 1 update trigger, 7 RLS policies (including public access via share_token), 1 trigger function to auto-increment submission_count |
| `lib/types/forms.ts` | `Form`, `FormSubmission`, `FormField` interfaces, `FormStatus`/`FormFieldType` types, `FORM_STATUSES`, `FORM_FIELD_TYPES` display configs |
| `lib/validations/forms.ts` | `formFieldSchema`, `formSchema` Zod schemas + `FormFormData` inferred type + `buildSubmissionValidator()` dynamic Zod schema builder from field definitions |

### Layer B: Server Actions & API Route
| File | Actions |
|------|---------|
| `lib/actions/forms.ts` | `createForm`, `updateForm`, `deleteForm`, `publishForm`, `archiveForm`, `unpublishForm`, `generateShareToken`, `getForms`, `getForm` |
| `lib/actions/submissions.ts` | `listSubmissions`, `deleteSubmission`, `linkSubmissionToContact`, `processSubmissionNotification` (internal, triggers notification to form owner) |
| `app/api/forms/submit/route.ts` | POST public form submission — validates share_token + field data via dynamic Zod, inserts submission, logs activity, notifies form owner |

### Layer C: Pages & Components
| File | Description |
|------|-------------|
| `app/(dashboard)/dashboard/forms/page.tsx` | Form list server page |
| `app/(dashboard)/dashboard/forms/loading.tsx` | Form grid loading skeleton |
| `app/(dashboard)/dashboard/forms/[id]/page.tsx` | Form builder/editor server page |
| `app/(dashboard)/dashboard/forms/[id]/loading.tsx` | Form editor loading skeleton |
| `app/(dashboard)/dashboard/forms/[id]/submissions/page.tsx` | Submissions list server page |
| `app/(dashboard)/dashboard/forms/[id]/submissions/loading.tsx` | Submissions table loading skeleton |
| `app/(public)/form/[token]/layout.tsx` | Public form minimal layout (mirrors invoice layout) |
| `app/(public)/form/[token]/page.tsx` | Public form page — fetches form by share_token via admin client |
| `components/forms/FormList.tsx` | Form card grid with search, status filter tabs (All/Draft/Active/Archived), create dialog, card actions (edit/submissions/archive/delete) |
| `components/forms/FormBuilder.tsx` | Visual form editor — field list + settings sidebar, save/publish/unpublish/archive actions, preview toggle, share link for active forms |
| `components/forms/FormFieldEditor.tsx` | Individual field config — label, type selector (12 types), placeholder, required checkbox, options editor for SELECT/MULTI_SELECT/RADIO |
| `components/forms/FormPreview.tsx` | Live form preview rendering all field types with disabled inputs |
| `components/forms/PublicFormView.tsx` | Public-facing form renderer — client-side validation, fetch-based submission to API, success confirmation state |
| `components/forms/SubmissionsList.tsx` | Submissions data table with dynamic columns from form fields, view detail dialog, delete action |
| `components/forms/SubmissionDetail.tsx` | Individual submission view — field data, linked CRM entities, metadata (timestamp, IP) |
| `components/forms/ShareFormButton.tsx` | Generate + copy share link (mirrors ShareLinkButton pattern) |

### Layer D: Integration (existing files modified)
| File | Change |
|------|--------|
| `components/dashboard/DashboardNav.tsx` | Added "Forms" nav item with `ClipboardList` icon → `/dashboard/forms` |
| `components/dashboard/MobileNav.tsx` | Same "Forms" nav item added |
| `components/dashboard/DashboardHeader.tsx` | Added `/dashboard/forms` → "Forms" page title |
| `lib/actions/search.ts` | Added `form` type to `SearchResult`, added forms table query to `globalSearch()` |
| `components/search/CommandKModal.tsx` | Added `form` type config with `ClipboardList` icon, updated placeholder text |
| `lib/types/crm.ts` | Added `FORM_SUBMITTED` to `ActivityType` union + `ACTIVITY_TYPE_CONFIG` |
| `components/crm/ActivityTimeline.tsx` | Added `ClipboardList` icon import + icon/color mapping for `FORM_SUBMITTED` activity type |
| `MODULES.md` | Added Forms & Data Capture module entry |

### File Count
- **New files: 19** (1 SQL + 1 types + 1 validation + 2 actions + 1 API route + 8 pages + 8 components)
- **Modified files: 8** (2 nav + 1 header + 1 search action + 1 search modal + 1 types + 1 activity timeline + 1 MODULES.md)

---

## All Phases Complete

All 6 modules have been built:
1. Task/Workflow Management ✅
2. Notifications (Infrastructure) ✅
3. File Storage & Document Management ✅
4. Scheduling & Calendar ✅
5. Messaging & Templates ✅
6. Forms & Data Capture ✅
