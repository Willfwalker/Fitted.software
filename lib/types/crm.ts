// ============================================
// CRM Type Definitions
// ============================================

export type DealStage =
  | "LEAD"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST"

export type ActivityType =
  | "NOTE"
  | "EMAIL"
  | "CALL"
  | "MEETING"
  | "DEAL_CREATED"
  | "DEAL_STAGE_CHANGED"
  | "CONTACT_CREATED"
  | "COMPANY_CREATED"
  | "INVOICE_CREATED"
  | "INVOICE_STATUS_CHANGED"
  | "INVOICE_SENT"
  | "INVOICE_RECURRING_CREATED"

export type DealPriority = "LOW" | "MEDIUM" | "HIGH"

export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED"

export interface Company {
  id: string
  org_id: string
  name: string
  domain: string | null
  industry: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  org_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  title: string | null
  company_id: string | null
  notes: string | null
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  company?: Pick<Company, "id" | "name"> | null
}

export interface Deal {
  id: string
  org_id: string
  title: string
  value: number | null
  stage: DealStage
  priority: DealPriority
  contact_id: string | null
  company_id: string | null
  expected_close_date: string | null
  closed_at: string | null
  assigned_to: string | null
  position: number
  notes: string | null
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  contact?: Pick<Contact, "id" | "first_name" | "last_name"> | null
  company?: Pick<Company, "id" | "name"> | null
}

export interface Activity {
  id: string
  org_id: string
  contact_id: string | null
  deal_id: string | null
  company_id: string | null
  type: ActivityType
  title: string
  content: string | null
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
}

export interface InvoiceLineItem {
  description: string
  quantity: number
  rate: number
  amount: number
}

export interface Invoice {
  id: string
  org_id: string
  invoice_number: string
  deal_id: string | null
  contact_id: string | null
  company_id: string | null
  status: InvoiceStatus
  items: InvoiceLineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  issue_date: string
  due_date: string | null
  paid_at: string | null
  discount_type: "percentage" | "flat" | null
  discount_value: number
  discount_amount: number
  payment_terms: string
  currency: string
  notes: string | null
  share_token?: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  contact?: Pick<Contact, "id" | "first_name" | "last_name" | "email"> | null
  company?: Pick<Company, "id" | "name" | "email" | "address"> | null
  deal?: Pick<Deal, "id" | "title"> | null
}

export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY"
export type RecurringStatus = "ACTIVE" | "PAUSED" | "COMPLETED"

export interface RecurringInvoice {
  id: string
  org_id: string
  source_invoice_id: string
  frequency: RecurringFrequency
  next_run_date: string
  end_date: string | null
  runs_count: number
  max_runs: number | null
  status: RecurringStatus
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  source_invoice?: Pick<Invoice, "id" | "invoice_number" | "total" | "currency"> & {
    contact?: Pick<Contact, "id" | "first_name" | "last_name"> | null
    company?: Pick<Company, "id" | "name"> | null
  }
}

export interface Tag {
  id: string
  org_id: string
  name: string
  color: string
  created_at: string
}

export interface EntityTag {
  id: string
  tag_id: string
  entity_type: "contact" | "company" | "deal"
  entity_id: string
  tag?: Tag
}

// Stage display config
export const DEAL_STAGES: { value: DealStage; label: string; color: string }[] = [
  { value: "LEAD", label: "Lead", color: "#8A817A" },
  { value: "QUALIFIED", label: "Qualified", color: "#5B8DEF" },
  { value: "PROPOSAL", label: "Proposal", color: "#D4734E" },
  { value: "NEGOTIATION", label: "Negotiation", color: "#E8A84C" },
  { value: "WON", label: "Won", color: "#5EC69A" },
  { value: "LOST", label: "Lost", color: "#EF5B5B" },
]

export const ACTIVE_STAGES: DealStage[] = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION"]
export const CLOSED_STAGES: DealStage[] = ["WON", "LOST"]

export const PRIORITY_CONFIG: Record<DealPriority, { label: string; color: string }> = {
  LOW: { label: "Low", color: "#8A817A" },
  MEDIUM: { label: "Medium", color: "#E8A84C" },
  HIGH: { label: "High", color: "#EF5B5B" },
}

export const INVOICE_STATUSES: { value: InvoiceStatus; label: string; color: string }[] = [
  { value: "DRAFT", label: "Draft", color: "#8A817A" },
  { value: "SENT", label: "Sent", color: "#5B8DEF" },
  { value: "PAID", label: "Paid", color: "#5EC69A" },
  { value: "OVERDUE", label: "Overdue", color: "#EF5B5B" },
  { value: "CANCELLED", label: "Cancelled", color: "#E8A84C" },
]

export const PAYMENT_TERMS = [
  { value: "DUE_ON_RECEIPT", label: "Due on Receipt", days: 0 },
  { value: "NET_15", label: "Net 15", days: 15 },
  { value: "NET_30", label: "Net 30", days: 30 },
  { value: "NET_45", label: "Net 45", days: 45 },
  { value: "NET_60", label: "Net 60", days: 60 },
  { value: "CUSTOM", label: "Custom", days: null },
]

export const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "CAD", label: "CAD ($)", symbol: "$" },
  { value: "AUD", label: "AUD ($)", symbol: "$" },
]

export const RECURRING_FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Every 2 Weeks" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
]

export const RECURRING_STATUSES: { value: RecurringStatus; label: string; color: string }[] = [
  { value: "ACTIVE", label: "Active", color: "#5EC69A" },
  { value: "PAUSED", label: "Paused", color: "#E8A84C" },
  { value: "COMPLETED", label: "Completed", color: "#8A817A" },
]

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, { label: string; icon: string }> = {
  NOTE: { label: "Note", icon: "FileText" },
  EMAIL: { label: "Email", icon: "Mail" },
  CALL: { label: "Call", icon: "Phone" },
  MEETING: { label: "Meeting", icon: "Calendar" },
  DEAL_CREATED: { label: "Deal Created", icon: "Plus" },
  DEAL_STAGE_CHANGED: { label: "Stage Changed", icon: "ArrowRight" },
  CONTACT_CREATED: { label: "Contact Created", icon: "UserPlus" },
  COMPANY_CREATED: { label: "Company Created", icon: "Building2" },
  INVOICE_CREATED: { label: "Invoice Created", icon: "Receipt" },
  INVOICE_STATUS_CHANGED: { label: "Invoice Updated", icon: "RefreshCw" },
  INVOICE_SENT: { label: "Invoice Sent", icon: "Send" },
  INVOICE_RECURRING_CREATED: { label: "Recurring Created", icon: "Repeat" },
}
