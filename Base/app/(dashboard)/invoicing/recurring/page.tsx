import { getServerContext } from "@/lib/supabase/context"
import { redirect } from "next/navigation"
import { RecurringList } from "@/components/invoicing/RecurringList"
import type { RecurringInvoice } from "@/lib/types/crm"

export default async function RecurringInvoicesPage() {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const { data: items } = await ctx.supabase
    .from("recurring_invoices")
    .select(`
      *,
      source_invoice:invoices(
        id, invoice_number, total, currency,
        contact:contacts(id, first_name, last_name),
        company:companies(id, name)
      )
    `)
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 lg:p-12 max-w-[1200px]">
      <RecurringList items={(items ?? []) as unknown as RecurringInvoice[]} />
    </div>
  )
}
