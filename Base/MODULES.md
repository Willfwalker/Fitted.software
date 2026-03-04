# Module Registry

## Pattern Reference
- Server action template: lib/actions/companies.ts
- Zod validation template: lib/validations/crm.ts
- Type definition template: lib/types/crm.ts
- Server page template: app/(dashboard)/crm/companies/page.tsx
- Client list template: components/crm/CompanyList.tsx
- Client form template: components/crm/CompanyForm.tsx
- Kanban template: components/crm/DealsPipeline.tsx
- Public share template: app/(public)/invoice/[token]/page.tsx

## Modules

### Auth
- Schema: supabase/schemas/001_base.sql
- Pages: app/(auth)/login/page.tsx, app/(auth)/signup/page.tsx
- API: app/api/auth/callback/route.ts, app/api/auth/validate-invite/route.ts
- Middleware: proxy.ts
- Entities: organizations, organization_members, invite_codes

### CRM
- Schema: supabase/schemas/002_crm.sql
- Types: lib/types/crm.ts
- Validation: lib/validations/crm.ts
- Actions: lib/actions/companies.ts, lib/actions/contacts.ts, lib/actions/deals.ts, lib/actions/activities.ts
- Pages: app/(dashboard)/crm/
- Components: components/crm/
- Entities: companies, contacts, deals, activities

### Invoicing
- Schema: supabase/schemas/003_invoicing_tags.sql, supabase/schemas/004_pdf_email_recurring.sql
- Types: lib/types/crm.ts (shared)
- Validation: lib/validations/crm.ts (shared)
- Actions: lib/actions/invoices.ts, lib/actions/recurring.ts
- Pages: app/(dashboard)/invoicing/
- Components: components/invoicing/
- Public: app/(public)/invoice/[token]/
- API: app/api/invoices/[id]/pdf/route.ts, app/api/invoices/public/[token]/pdf/route.ts, app/api/cron/recurring-invoices/route.ts
- Email: lib/email/invoice-email.ts
- PDF: lib/pdf/invoice-template.tsx
- Entities: invoices, invoice_line_items, recurring_invoices, invoice_share_tokens

### Dashboard
- Pages: app/(dashboard)/dashboard/page.tsx
- Components: components/dashboard/DashboardNav.tsx, components/dashboard/MobileNav.tsx, components/dashboard/DashboardHeader.tsx, components/dashboard/DashboardShell.tsx, components/dashboard/StatCard.tsx, components/dashboard/RevenueChart.tsx, components/dashboard/ActivityFeed.tsx, components/dashboard/TeamList.tsx
- Layout: app/(dashboard)/layout.tsx

### Reports
- Pages: app/(dashboard)/reports/page.tsx
- Components: components/reports/ReportsView.tsx, components/reports/RevenueOverTimeChart.tsx, components/reports/PipelineSummaryChart.tsx, components/reports/ConversionFunnelChart.tsx, components/reports/ActivitySummaryChart.tsx

### Search
- Actions: lib/actions/search.ts
- Components: components/search/CommandKModal.tsx
- Entities searched: contacts, companies, deals, tasks, files, events, messages, templates, forms

### Tags
- Schema: supabase/schemas/003_invoicing_tags.sql (shared with invoicing)
- Actions: lib/actions/tags.ts
- Components: components/tags/TagManager.tsx, components/tags/TagSelector.tsx, components/tags/TagBadge.tsx
- Entities: tags, entity_tags

### CSV Import/Export
- Actions: lib/actions/csv.ts
- Components: components/csv/CsvImportDialog.tsx, components/csv/ColumnMapper.tsx, components/csv/ImportPreviewTable.tsx, components/csv/CsvExportButton.tsx

### Tasks/Workflow
- Schema: supabase/schemas/005_tasks.sql
- Types: lib/types/tasks.ts
- Validation: lib/validations/tasks.ts
- Actions: lib/actions/boards.ts, lib/actions/tasks.ts, lib/actions/labels.ts
- Pages: app/(dashboard)/tasks/page.tsx, app/(dashboard)/tasks/[boardId]/page.tsx
- Components: components/tasks/BoardList.tsx, components/tasks/BoardForm.tsx, components/tasks/KanbanBoard.tsx, components/tasks/KanbanColumn.tsx, components/tasks/TaskCard.tsx, components/tasks/TaskForm.tsx, components/tasks/TaskDetailSheet.tsx, components/tasks/LabelBadge.tsx, components/tasks/LabelManager.tsx
- Nav: /tasks (Projects)
- Entities: boards, board_columns, tasks, labels, task_labels

### Notifications (Infrastructure)
- Schema: supabase/schemas/006_notifications.sql
- Types: lib/types/notifications.ts
- Validation: lib/validations/notifications.ts
- Actions: lib/actions/notifications.ts
- Components: components/notifications/NotificationBell.tsx, components/notifications/NotificationPanel.tsx, components/notifications/NotificationItem.tsx
- Integration: NotificationBell rendered in components/dashboard/DashboardHeader.tsx
- Usage: Other modules call createNotification() from their server actions
- Entities: notifications

### File Storage
- Schema: supabase/schemas/007_files.sql
- Types: lib/types/files.ts
- Validation: lib/validations/files.ts
- Actions: lib/actions/files.ts
- Pages: app/(dashboard)/files/page.tsx
- Components: components/files/FileBrowser.tsx, components/files/FileCard.tsx, components/files/FileUploadZone.tsx, components/files/FilePreviewModal.tsx, components/files/EntityFileAttacher.tsx
- API: app/api/files/upload/route.ts, app/api/files/[id]/download/route.ts
- Nav: /files (Files)
- Entities: files, entity_files
- Reusable: EntityFileAttacher can be dropped into any entity detail page

### Scheduling & Calendar
- Schema: supabase/schemas/008_scheduling.sql
- Types: lib/types/scheduling.ts
- Validation: lib/validations/scheduling.ts
- Actions: lib/actions/events.ts
- Pages: app/(dashboard)/calendar/page.tsx
- Components: components/calendar/CalendarView.tsx, components/calendar/EventForm.tsx, components/calendar/EventDetailSheet.tsx
- Nav: /calendar (Calendar)
- Entities: calendar_events
- Dependencies: @schedule-x/react, @schedule-x/calendar, @schedule-x/events-service, @schedule-x/drag-and-drop, @schedule-x/theme-default, temporal-polyfill

### Messaging & Templates
- Schema: supabase/schemas/009_messaging.sql
- Types: lib/types/messaging.ts
- Validation: lib/validations/messaging.ts
- Actions: lib/actions/messages.ts, lib/actions/templates.ts
- Pages: app/(dashboard)/messages/page.tsx, app/(dashboard)/messages/templates/page.tsx
- Components: components/messages/MessageList.tsx, components/messages/ComposeMessage.tsx, components/messages/TemplateList.tsx, components/messages/TemplateForm.tsx, components/messages/TemplatePreview.tsx
- Nav: /messages (Messages)
- Entities: messages, message_templates
- Uses: Resend for email delivery, createNotification() for delivery status

### Forms & Data Capture
- Schema: supabase/schemas/010_forms.sql
- Types: lib/types/forms.ts
- Validation: lib/validations/forms.ts
- Actions: lib/actions/forms.ts, lib/actions/submissions.ts
- Pages: app/(dashboard)/forms/page.tsx, app/(dashboard)/forms/[id]/page.tsx, app/(dashboard)/forms/[id]/submissions/page.tsx
- Components: components/forms/FormList.tsx, components/forms/FormBuilder.tsx, components/forms/FormFieldEditor.tsx, components/forms/FormPreview.tsx, components/forms/PublicFormView.tsx, components/forms/SubmissionsList.tsx, components/forms/SubmissionDetail.tsx, components/forms/ShareFormButton.tsx
- Public: app/(public)/form/[token]/page.tsx, app/(public)/form/[token]/layout.tsx
- API: app/api/forms/submit/route.ts
- Nav: /forms (Forms)
- Entities: forms, form_submissions
- Uses: createNotification() for submission alerts, public share_token pattern (mirrors invoicing)

### Settings
- Pages: app/(dashboard)/settings/page.tsx

## Cross-Cutting Files
- Helpers: lib/actions/helpers.ts (getOrgId utility)
- Supabase clients: lib/supabase/server.ts, lib/supabase/client.ts
- Nav: components/dashboard/DashboardNav.tsx, components/dashboard/MobileNav.tsx
- UI primitives: components/ui/ (shadcn/ui new-york)
