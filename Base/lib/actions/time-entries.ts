"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { isAtLeast } from "@/lib/rbac/permissions"
import { timeEntrySchema, timerStartSchema } from "@/lib/validations/time-tracking"
import type { TimeEntry, TimeSummary } from "@/lib/types/time-tracking"

export type TimeEntryActionState = {
  error?: string
  success?: boolean
  timeEntryId?: string
}

export async function createTimeEntry(
  data: {
    task_id?: string
    deal_id?: string
    contact_id?: string
    company_id?: string
    description?: string
    duration_minutes: number
    date: string
    billable?: boolean
    rate?: number
  }
): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = timeEntrySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  const { data: entry, error } = await supabase
    .from("time_entries")
    .insert({
      org_id: ctx.orgId,
      user_id: ctx.userId,
      task_id: d.task_id || null,
      deal_id: d.deal_id || null,
      contact_id: d.contact_id || null,
      company_id: d.company_id || null,
      description: d.description || null,
      duration_minutes: d.duration_minutes,
      date: d.date,
      billable: d.billable,
      rate: d.rate,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Log activity
  const hours = (d.duration_minutes / 60).toFixed(1)
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: d.deal_id || null,
    contact_id: d.contact_id || null,
    company_id: d.company_id || null,
    type: "TIME_LOGGED",
    title: `Logged ${hours}h${d.billable ? " (billable)" : ""}`,
    metadata: { time_entry_id: entry.id, duration_minutes: d.duration_minutes, billable: d.billable },
    created_by: ctx.userId,
  })

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return { success: true, timeEntryId: entry.id }
}

export async function startTimer(
  data: {
    task_id?: string
    deal_id?: string
    contact_id?: string
    company_id?: string
    description?: string
    billable?: boolean
    rate?: number
  }
): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = timerStartSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Check for existing running timer
  const { data: running } = await supabase
    .from("time_entries")
    .select("id")
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .not("timer_started_at", "is", null)
    .is("timer_paused_at", null)
    .eq("duration_minutes", 0)
    .limit(1)

  if (running && running.length > 0) {
    return { error: "You already have a running timer. Stop it first." }
  }

  const { data: entry, error } = await supabase
    .from("time_entries")
    .insert({
      org_id: ctx.orgId,
      user_id: ctx.userId,
      task_id: d.task_id || null,
      deal_id: d.deal_id || null,
      contact_id: d.contact_id || null,
      company_id: d.company_id || null,
      description: d.description || null,
      duration_minutes: 0,
      date: new Date().toISOString().split("T")[0],
      billable: d.billable,
      rate: d.rate,
      timer_started_at: new Date().toISOString(),
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true, timeEntryId: entry.id }
}

export async function pauseTimer(id: string): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { data: entry } = await supabase
    .from("time_entries")
    .select("timer_started_at, timer_paused_at, duration_minutes")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .single()

  if (!entry) return { error: "Time entry not found" }
  if (!entry.timer_started_at) return { error: "Timer is not running" }
  if (entry.timer_paused_at) return { error: "Timer is already paused" }

  // Calculate elapsed since last start
  const elapsed = Math.floor(
    (Date.now() - new Date(entry.timer_started_at).getTime()) / 60000
  )

  const { error } = await supabase
    .from("time_entries")
    .update({
      timer_paused_at: new Date().toISOString(),
      duration_minutes: entry.duration_minutes + elapsed,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function resumeTimer(id: string): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { data: entry } = await supabase
    .from("time_entries")
    .select("timer_paused_at")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .single()

  if (!entry) return { error: "Time entry not found" }
  if (!entry.timer_paused_at) return { error: "Timer is not paused" }

  const { error } = await supabase
    .from("time_entries")
    .update({
      timer_started_at: new Date().toISOString(),
      timer_paused_at: null,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function stopTimer(id: string): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { data: entry } = await supabase
    .from("time_entries")
    .select("timer_started_at, timer_paused_at, duration_minutes, task_id, deal_id, contact_id, company_id, billable")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .single()

  if (!entry) return { error: "Time entry not found" }
  if (!entry.timer_started_at && entry.duration_minutes === 0) {
    return { error: "Timer was never started" }
  }

  // Calculate final duration
  let totalMinutes = entry.duration_minutes
  if (entry.timer_started_at && !entry.timer_paused_at) {
    // Timer is currently running — add elapsed
    const elapsed = Math.floor(
      (Date.now() - new Date(entry.timer_started_at).getTime()) / 60000
    )
    totalMinutes += elapsed
  }

  // Minimum 1 minute
  totalMinutes = Math.max(1, totalMinutes)

  const { error } = await supabase
    .from("time_entries")
    .update({
      timer_started_at: null,
      timer_paused_at: null,
      duration_minutes: totalMinutes,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Log activity
  const hours = (totalMinutes / 60).toFixed(1)
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: entry.deal_id,
    contact_id: entry.contact_id,
    company_id: entry.company_id,
    type: "TIME_LOGGED",
    title: `Logged ${hours}h${entry.billable ? " (billable)" : ""} via timer`,
    metadata: { time_entry_id: id, duration_minutes: totalMinutes, billable: entry.billable },
    created_by: ctx.userId,
  })

  revalidatePath("/tasks")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateTimeEntry(
  id: string,
  data: {
    description?: string
    duration_minutes?: number
    date?: string
    billable?: boolean
    rate?: number
    task_id?: string
    deal_id?: string
    contact_id?: string
    company_id?: string
  }
): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Cannot edit invoiced entries
  const { data: entry } = await supabase
    .from("time_entries")
    .select("invoice_id")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!entry) return { error: "Time entry not found" }
  if (entry.invoice_id) return { error: "Cannot edit an invoiced time entry" }

  const update: Record<string, unknown> = {}
  if (data.description !== undefined) update.description = data.description || null
  if (data.duration_minutes !== undefined) update.duration_minutes = data.duration_minutes
  if (data.date !== undefined) update.date = data.date
  if (data.billable !== undefined) update.billable = data.billable
  if (data.rate !== undefined) update.rate = data.rate
  if (data.task_id !== undefined) update.task_id = data.task_id || null
  if (data.deal_id !== undefined) update.deal_id = data.deal_id || null
  if (data.contact_id !== undefined) update.contact_id = data.contact_id || null
  if (data.company_id !== undefined) update.company_id = data.company_id || null

  const { error } = await supabase
    .from("time_entries")
    .update(update)
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function deleteTimeEntry(id: string): Promise<TimeEntryActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Cannot delete invoiced entries
  const { data: entry } = await supabase
    .from("time_entries")
    .select("invoice_id")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!entry) return { error: "Time entry not found" }
  if (entry.invoice_id) return { error: "Cannot delete an invoiced time entry" }

  const { error } = await supabase
    .from("time_entries")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function getTimeEntries(filters?: {
  task_id?: string
  deal_id?: string
  contact_id?: string
  company_id?: string
  user_id?: string
  billable?: boolean
  date_from?: string
  date_to?: string
  invoiced?: boolean
}): Promise<{ data: TimeEntry[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  // Permission guard: non-admins can only see their own entries
  if (filters?.user_id && filters.user_id !== ctx.userId && !isAtLeast(ctx.role, "ADMIN")) {
    return { data: [], error: "You do not have permission to view other members' time entries" }
  }
  // Auto-scope non-admins to their own entries
  const effectiveUserId = filters?.user_id ?? (isAtLeast(ctx.role, "ADMIN") ? undefined : ctx.userId)

  const supabase = await createClient()

  let query = supabase
    .from("time_entries")
    .select("*, task:tasks(id, title), deal:deals(id, title), contact:contacts(id, first_name, last_name), company:companies(id, name), invoice:invoices(id, invoice_number)")
    .eq("org_id", ctx.orgId)
    .order("date", { ascending: false })

  if (filters?.task_id) query = query.eq("task_id", filters.task_id)
  if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id)
  if (filters?.contact_id) query = query.eq("contact_id", filters.contact_id)
  if (filters?.company_id) query = query.eq("company_id", filters.company_id)
  if (effectiveUserId) query = query.eq("user_id", effectiveUserId)
  if (filters?.billable !== undefined) query = query.eq("billable", filters.billable)
  if (filters?.date_from) query = query.gte("date", filters.date_from)
  if (filters?.date_to) query = query.lte("date", filters.date_to)
  if (filters?.invoiced === true) query = query.not("invoice_id", "is", null)
  if (filters?.invoiced === false) query = query.is("invoice_id", null)

  const { data, error } = await query

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as TimeEntry[] }
}

export async function getTimeSummary(filters?: {
  task_id?: string
  deal_id?: string
  user_id?: string
  date_from?: string
  date_to?: string
  billable?: boolean
}): Promise<{ data: TimeSummary; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: { total_minutes: 0, total_hours: 0, billable_minutes: 0, billable_hours: 0, billable_amount: 0, entry_count: 0 }, error: "Not authenticated" }

  // Permission guard: non-admins can only see their own summary
  if (filters?.user_id && filters.user_id !== ctx.userId && !isAtLeast(ctx.role, "ADMIN")) {
    return { data: { total_minutes: 0, total_hours: 0, billable_minutes: 0, billable_hours: 0, billable_amount: 0, entry_count: 0 }, error: "You do not have permission to view other members' time summaries" }
  }
  const effectiveUserId = filters?.user_id ?? (isAtLeast(ctx.role, "ADMIN") ? undefined : ctx.userId)

  const supabase = await createClient()

  let query = supabase
    .from("time_entries")
    .select("duration_minutes, billable, rate")
    .eq("org_id", ctx.orgId)

  if (filters?.task_id) query = query.eq("task_id", filters.task_id)
  if (filters?.deal_id) query = query.eq("deal_id", filters.deal_id)
  if (effectiveUserId) query = query.eq("user_id", effectiveUserId)
  if (filters?.date_from) query = query.gte("date", filters.date_from)
  if (filters?.date_to) query = query.lte("date", filters.date_to)
  if (filters?.billable !== undefined) query = query.eq("billable", filters.billable)

  const { data, error } = await query

  if (error) return { data: { total_minutes: 0, total_hours: 0, billable_minutes: 0, billable_hours: 0, billable_amount: 0, entry_count: 0 }, error: error.message }

  const entries = data ?? []
  const total_minutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
  const billableEntries = entries.filter((e) => e.billable)
  const billable_minutes = billableEntries.reduce((sum, e) => sum + e.duration_minutes, 0)
  const billable_amount = billableEntries.reduce((sum, e) => sum + (e.duration_minutes / 60) * (e.rate || 0), 0)

  return {
    data: {
      total_minutes,
      total_hours: Number((total_minutes / 60).toFixed(1)),
      billable_minutes,
      billable_hours: Number((billable_minutes / 60).toFixed(1)),
      billable_amount: Number(billable_amount.toFixed(2)),
      entry_count: entries.length,
    },
  }
}

export async function getRunningTimer(): Promise<{ data: TimeEntry | null; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("time_entries")
    .select("*, task:tasks(id, title)")
    .eq("org_id", ctx.orgId)
    .eq("user_id", ctx.userId)
    .not("timer_started_at", "is", null)
    .is("timer_paused_at", null)
    .eq("duration_minutes", 0)
    .limit(1)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: data as TimeEntry | null }
}

export async function generateInvoiceFromTime(
  entryIds: string[],
  contactId?: string,
  companyId?: string,
  dealId?: string
): Promise<{ error?: string; success?: boolean; invoiceId?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  if (entryIds.length === 0) return { error: "No time entries selected" }

  const supabase = await createClient()

  // Fetch entries
  const { data: entries, error: fetchError } = await supabase
    .from("time_entries")
    .select("id, description, duration_minutes, rate, billable, invoice_id")
    .eq("org_id", ctx.orgId)
    .in("id", entryIds)

  if (fetchError) return { error: fetchError.message }
  if (!entries || entries.length === 0) return { error: "No entries found" }

  // Ensure none are already invoiced
  const alreadyInvoiced = entries.filter((e) => e.invoice_id)
  if (alreadyInvoiced.length > 0) return { error: `${alreadyInvoiced.length} entries are already invoiced` }

  // Build invoice line items
  const items = entries.map((e) => {
    const hours = Number((e.duration_minutes / 60).toFixed(2))
    const rate = e.rate || 0
    return {
      description: e.description || "Time entry",
      quantity: hours,
      rate,
      amount: Number((hours * rate).toFixed(2)),
    }
  })

  const subtotal = items.reduce((sum, i) => sum + i.amount, 0)

  // Get next invoice number
  const { data: numResult, error: numError } = await supabase
    .rpc("next_invoice_number", { p_org_id: ctx.orgId })

  if (numError || !numResult) return { error: numError?.message || "Failed to generate invoice number" }

  const today = new Date().toISOString().split("T")[0]

  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      org_id: ctx.orgId,
      invoice_number: numResult,
      contact_id: contactId || null,
      company_id: companyId || null,
      deal_id: dealId || null,
      status: "DRAFT",
      items,
      subtotal: Number(subtotal.toFixed(2)),
      tax_rate: 0,
      tax_amount: 0,
      total: Number(subtotal.toFixed(2)),
      discount_type: null,
      discount_value: 0,
      discount_amount: 0,
      issue_date: today,
      payment_terms: "NET_30",
      currency: "USD",
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (insertError) return { error: insertError.message }

  // Link entries to invoice
  await supabase
    .from("time_entries")
    .update({ invoice_id: invoice.id })
    .eq("org_id", ctx.orgId)
    .in("id", entryIds)

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    contact_id: contactId || null,
    company_id: companyId || null,
    deal_id: dealId || null,
    type: "INVOICE_CREATED",
    title: `Created invoice ${numResult} from ${entries.length} time entries`,
    metadata: { invoice_id: invoice.id, entry_count: entries.length, total: subtotal },
    created_by: ctx.userId,
  })

  revalidatePath("/invoicing")
  revalidatePath("/tasks")
  return { success: true, invoiceId: invoice.id }
}
