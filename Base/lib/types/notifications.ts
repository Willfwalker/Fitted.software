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
