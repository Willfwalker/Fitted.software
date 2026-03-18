// ============================================
// Workflow Automation Type Definitions
// ============================================

export type TriggerType =
  | "DEAL_STAGE_CHANGED"
  | "TASK_STATUS_CHANGED"
  | "INVOICE_STATUS_CHANGED"
  | "FORM_SUBMITTED"
  | "TIME_LOGGED"
  | "PAYMENT_RECEIVED"
  | "EMAIL_RECEIVED"

export type ActionType =
  | "CREATE_TASK"
  | "SEND_EMAIL"
  | "CREATE_INVOICE"
  | "SEND_NOTIFICATION"
  | "UPDATE_DEAL_STAGE"
  | "CREATE_EVENT"

export type AutomationLogStatus = "SUCCESS" | "FAILED"

export interface Automation {
  id: string
  org_id: string
  name: string
  description: string | null
  trigger_type: TriggerType
  trigger_config: Record<string, unknown>
  action_type: ActionType
  action_config: Record<string, unknown>
  enabled: boolean
  last_run_at: string | null
  run_count: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface AutomationLog {
  id: string
  automation_id: string
  org_id: string
  trigger_data: Record<string, unknown> | null
  action_result: Record<string, unknown> | null
  status: AutomationLogStatus
  error_message: string | null
  created_at: string
}

export const TRIGGER_TYPES: { value: TriggerType; label: string; description: string }[] = [
  { value: "DEAL_STAGE_CHANGED", label: "Deal Stage Changed", description: "When a deal moves to a new stage" },
  { value: "TASK_STATUS_CHANGED", label: "Task Status Changed", description: "When a task moves to a new column" },
  { value: "INVOICE_STATUS_CHANGED", label: "Invoice Status Changed", description: "When an invoice status changes" },
  { value: "FORM_SUBMITTED", label: "Form Submitted", description: "When a form receives a submission" },
  { value: "TIME_LOGGED", label: "Time Logged", description: "When time is logged on a task" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received", description: "When a Stripe payment is received" },
  { value: "EMAIL_RECEIVED", label: "Email Received", description: "When an inbound email is received" },
]

export const ACTION_TYPES: { value: ActionType; label: string; description: string }[] = [
  { value: "CREATE_TASK", label: "Create Task", description: "Create a new task on a board" },
  { value: "SEND_EMAIL", label: "Send Email", description: "Send an email to a contact" },
  { value: "CREATE_INVOICE", label: "Create Invoice", description: "Generate a new invoice" },
  { value: "SEND_NOTIFICATION", label: "Send Notification", description: "Notify team members" },
  { value: "UPDATE_DEAL_STAGE", label: "Update Deal Stage", description: "Move a deal to a new stage" },
  { value: "CREATE_EVENT", label: "Create Calendar Event", description: "Create a calendar event" },
]
