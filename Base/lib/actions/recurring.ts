"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { recurringInvoiceSchema } from "@/lib/validations/crm"
import type { RecurringStatus } from "@/lib/types/crm"

export type RecurringActionState = {
  error?: string
  success?: boolean
  id?: string
}

export async function createRecurringInvoice(data: {
  source_invoice_id: string
  frequency: string
  start_date: string
  end_date?: string
  max_runs?: number
}): Promise<RecurringActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = recurringInvoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Verify source invoice belongs to org
  const { data: source } = await supabase
    .from("invoices")
    .select("id, invoice_number, contact_id, company_id, deal_id")
    .eq("id", d.source_invoice_id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!source) return { error: "Source invoice not found" }

  const { data: recurring, error } = await supabase
    .from("recurring_invoices")
    .insert({
      org_id: ctx.orgId,
      source_invoice_id: d.source_invoice_id,
      frequency: d.frequency,
      next_run_date: d.start_date,
      end_date: d.end_date || null,
      max_runs: d.max_runs ?? null,
      status: "ACTIVE" as RecurringStatus,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: source.deal_id,
    contact_id: source.contact_id,
    company_id: source.company_id,
    type: "INVOICE_RECURRING_CREATED",
    title: `Created recurring schedule for ${source.invoice_number} (${d.frequency})`,
    metadata: { recurring_id: recurring.id, source_invoice_id: d.source_invoice_id, frequency: d.frequency },
    created_by: ctx.userId,
  })

  revalidatePath("/invoicing/recurring")
  revalidatePath(`/invoicing/${d.source_invoice_id}`)
  return { success: true, id: recurring.id }
}

export async function updateRecurringStatus(
  id: string,
  newStatus: RecurringStatus
): Promise<RecurringActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("recurring_invoices")
    .update({ status: newStatus })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/invoicing/recurring")
  return { success: true }
}

export async function deleteRecurringInvoice(id: string): Promise<RecurringActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("recurring_invoices")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/invoicing/recurring")
  return { success: true }
}
