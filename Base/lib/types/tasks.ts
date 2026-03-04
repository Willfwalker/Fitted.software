// ============================================
// Tasks/Workflow Type Definitions
// ============================================

export type TaskPriority = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "URGENT"
export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED"

export interface Board {
  id: string
  org_id: string
  name: string
  description: string | null
  archived: boolean
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  columns?: BoardColumn[]
  task_count?: number
}

export interface BoardColumn {
  id: string
  board_id: string
  name: string
  position: number
  wip_limit: number | null
  color: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Joined
  tasks?: Task[]
}

export interface Task {
  id: string
  org_id: string
  board_id: string
  column_id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  assigned_to: string | null
  contact_id: string | null
  company_id: string | null
  deal_id: string | null
  position: number
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  labels?: Label[]
  contact?: { id: string; first_name: string; last_name: string } | null
  company?: { id: string; name: string } | null
  deal?: { id: string; title: string } | null
  assigned_user?: { id: string; email: string; raw_user_meta_data: Record<string, unknown> } | null
}

export interface Label {
  id: string
  org_id: string
  name: string
  color: string
  created_at: string
}

export interface TaskLabel {
  id: string
  task_id: string
  label_id: string
  created_at: string
  label?: Label
}

// Display configs
export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "NONE", label: "None", color: "#6B6560" },
  { value: "LOW", label: "Low", color: "#8A817A" },
  { value: "MEDIUM", label: "Medium", color: "#5B8DEF" },
  { value: "HIGH", label: "High", color: "#E8A84C" },
  { value: "URGENT", label: "Urgent", color: "#EF5B5B" },
]

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: "TODO", label: "To Do", color: "#8A817A" },
  { value: "IN_PROGRESS", label: "In Progress", color: "#5B8DEF" },
  { value: "IN_REVIEW", label: "In Review", color: "#E8A84C" },
  { value: "DONE", label: "Done", color: "#5EC69A" },
  { value: "CANCELLED", label: "Cancelled", color: "#EF5B5B" },
]

export const DEFAULT_BOARD_COLUMNS: { name: string; color: string }[] = [
  { name: "To Do", color: "#8A817A" },
  { name: "In Progress", color: "#5B8DEF" },
  { name: "In Review", color: "#E8A84C" },
  { name: "Done", color: "#5EC69A" },
]
