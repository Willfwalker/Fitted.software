// ============================================
// Scheduling & Calendar Type Definitions
// ============================================

export type EventStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW"

export interface CalendarEvent {
  id: string
  org_id: string
  title: string
  description: string | null
  location: string | null
  start_at: string
  end_at: string | null
  all_day: boolean
  status: EventStatus
  color: string | null
  contact_id: string | null
  company_id: string | null
  deal_id: string | null
  assigned_to: string | null
  google_event_id: string | null
  google_calendar_id: string | null
  last_synced_at: string | null
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  contact?: { id: string; first_name: string; last_name: string } | null
  company?: { id: string; name: string } | null
  deal?: { id: string; title: string } | null
  assigned_user?: { id: string; email: string; raw_user_meta_data: Record<string, unknown> } | null
}

export const EVENT_STATUSES: { value: EventStatus; label: string; color: string }[] = [
  { value: "SCHEDULED", label: "Scheduled", color: "#5B8DEF" },
  { value: "COMPLETED", label: "Completed", color: "#5EC69A" },
  { value: "CANCELLED", label: "Cancelled", color: "#8A817A" },
  { value: "NO_SHOW", label: "No Show", color: "#EF5B5B" },
]

export const EVENT_COLORS: { value: string; label: string }[] = [
  { value: "#D4734E", label: "Accent" },
  { value: "#5B8DEF", label: "Blue" },
  { value: "#5EC69A", label: "Green" },
  { value: "#E8A84C", label: "Amber" },
  { value: "#EF5B5B", label: "Red" },
  { value: "#A78BFA", label: "Purple" },
  { value: "#8A817A", label: "Neutral" },
]
