// ============================================
// Time Tracking Type Definitions
// ============================================

import type { Contact, Company, Deal, Invoice } from "./crm"

export interface TimeEntry {
  id: string
  org_id: string
  task_id: string | null
  deal_id: string | null
  contact_id: string | null
  company_id: string | null
  user_id: string
  description: string | null
  duration_minutes: number
  date: string
  billable: boolean
  rate: number
  invoice_id: string | null
  timer_started_at: string | null
  timer_paused_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  // Joined
  task?: { id: string; title: string } | null
  deal?: Pick<Deal, "id" | "title"> | null
  contact?: Pick<Contact, "id" | "first_name" | "last_name"> | null
  company?: Pick<Company, "id" | "name"> | null
  invoice?: Pick<Invoice, "id" | "invoice_number"> | null
  user?: { id: string; email: string; raw_user_meta_data: Record<string, unknown> } | null
}

export interface TimeSummary {
  total_minutes: number
  total_hours: number
  billable_minutes: number
  billable_hours: number
  billable_amount: number
  entry_count: number
}
