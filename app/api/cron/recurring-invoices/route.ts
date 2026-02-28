import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function addFrequency(date: Date, frequency: string): Date {
  const result = new Date(date)
  switch (frequency) {
    case "WEEKLY":
      result.setDate(result.getDate() + 7)
      break
    case "BIWEEKLY":
      result.setDate(result.getDate() + 14)
      break
    case "MONTHLY":
      result.setMonth(result.getMonth() + 1)
      break
    case "QUARTERLY":
      result.setMonth(result.getMonth() + 3)
      break
    case "YEARLY":
      result.setFullYear(result.getFullYear() + 1)
      break
  }
  return result
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date().toISOString().split("T")[0]

  // Fetch active recurring invoices that are due
  const { data: dueRecurrings, error: fetchError } = await supabase
    .from("recurring_invoices")
    .select("*, source_invoice:invoices(*)")
    .eq("status", "ACTIVE")
    .lte("next_run_date", today)

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  let created = 0
  let errors = 0

  for (const recurring of dueRecurrings ?? []) {
    try {
      const source = recurring.source_invoice

      if (!source) {
        errors++
        continue
      }

      // Get next invoice number
      const { data: numResult, error: numError } = await supabase
        .rpc("next_invoice_number", { p_org_id: recurring.org_id })

      if (numError || !numResult) {
        errors++
        continue
      }

      // Create new DRAFT invoice
      const { error: insertError } = await supabase
        .from("invoices")
        .insert({
          org_id: recurring.org_id,
          invoice_number: numResult,
          deal_id: source.deal_id,
          contact_id: source.contact_id,
          company_id: source.company_id,
          status: "DRAFT",
          items: source.items,
          subtotal: source.subtotal,
          tax_rate: source.tax_rate,
          tax_amount: source.tax_amount,
          total: source.total,
          issue_date: today,
          due_date: null,
          paid_at: null,
          discount_type: source.discount_type,
          discount_value: source.discount_value,
          discount_amount: source.discount_amount,
          payment_terms: source.payment_terms,
          currency: source.currency,
          notes: source.notes,
          created_by: recurring.created_by,
        })

      if (insertError) {
        errors++
        continue
      }

      // Calculate next run date
      const nextDate = addFrequency(new Date(recurring.next_run_date + "T00:00:00"), recurring.frequency)
      const newRunsCount = recurring.runs_count + 1

      // Check if completed
      const pastEndDate = recurring.end_date && nextDate > new Date(recurring.end_date + "T00:00:00")
      const hitMaxRuns = recurring.max_runs && newRunsCount >= recurring.max_runs
      const isCompleted = pastEndDate || hitMaxRuns

      await supabase
        .from("recurring_invoices")
        .update({
          next_run_date: nextDate.toISOString().split("T")[0],
          runs_count: newRunsCount,
          status: isCompleted ? "COMPLETED" : "ACTIVE",
        })
        .eq("id", recurring.id)

      created++
    } catch {
      errors++
    }
  }

  return NextResponse.json({
    processed: (dueRecurrings ?? []).length,
    created,
    errors,
  })
}
