import { getServerContext } from "@/lib/supabase/context"
import { redirect } from "next/navigation"
import { InvoiceList } from "@/components/invoicing/InvoiceList"
import { getUiConfig } from "@/lib/actions/ui-config"
import { applyCustomFilters, applyCustomSort } from "@/lib/utils/ui-config-helpers"
import type { Invoice } from "@/lib/types/crm"

export default async function InvoicingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const params = await searchParams
  const search = params.q || ""
  const status = params.status || ""
  const sort = params.sort

  const uiConfig = await getUiConfig("invoices")

  let query = ctx.supabase
    .from("invoices")
    .select("*, contact:contacts(id, first_name, last_name), company:companies(id, name), deal:deals(id, title)")
    .eq("org_id", ctx.orgId)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (search) {
    query = query.or(`invoice_number.ilike.%${search}%,company.name.ilike.%${search}%,contact.first_name.ilike.%${search}%,contact.last_name.ilike.%${search}%`)
  }

  // Apply custom filters
  query = applyCustomFilters(query, uiConfig.filters, params)

  // Apply custom sort or default
  let customSortApplied = false
  if (sort) {
    const result = applyCustomSort(query, uiConfig, sort)
    query = result.query
    customSortApplied = result.applied
  }

  if (!customSortApplied) {
    query = query.order("created_at", { ascending: false })
  }

  const { data: invoices } = await query

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Invoicing
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Invoices
        </h1>
      </div>

      <InvoiceList
        invoices={(invoices ?? []) as Invoice[]}
        searchQuery={search}
        currentStatus={status}
        uiConfig={uiConfig}
      />
    </div>
  )
}
