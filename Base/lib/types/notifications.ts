// ============================================
// Notifications Type Definitions
// ============================================

export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED"

export interface Notification {
  id: string
  org_id: string
  user_id: string
  title: string
  body: string | null
  link: string | null
  icon: string | null
  status: NotificationStatus
  source_type: string | null
  source_id: string | null
  created_at: string
}

// Maps source_type to lucide icon name for display
export const NOTIFICATION_ICONS: Record<string, string> = {
  task: "CheckSquare",
  deal: "Handshake",
  contact: "User",
  company: "Building2",
  invoice: "FileText",
  event: "Calendar",
  form: "ClipboardList",
  message: "Mail",
  file: "Paperclip",
}

// ============================================
// Notification Categories & Preferences
// ============================================

export const NOTIFICATION_CATEGORIES = [
  { key: "task", label: "Tasks", description: "Task created, status changed, assigned" },
  { key: "deal", label: "Deals", description: "Deal created, stage changed" },
  { key: "contact", label: "Contacts & Companies", description: "Contact or company created" },
  { key: "invoice", label: "Invoices", description: "Invoice created, status changed, sent" },
  { key: "event", label: "Calendar", description: "Event created, completed" },
  { key: "file", label: "Files", description: "File uploaded" },
  { key: "message", label: "Messages", description: "Message delivered" },
  { key: "form_submission", label: "Forms", description: "Form submitted" },
] as const

export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number]["key"]

/** Maps source_type values to their notification category */
export const SOURCE_TYPE_TO_CATEGORY: Record<string, NotificationCategory> = {
  task: "task",
  deal: "deal",
  contact: "contact",
  company: "contact",
  invoice: "invoice",
  event: "event",
  file: "file",
  message: "message",
  form_submission: "form_submission",
  form: "form_submission",
}

export interface NotificationPreference {
  id: string
  org_id: string
  user_id: string
  category: NotificationCategory
  enabled: boolean
  created_at: string
  updated_at: string
}
