import { getServerContext } from "@/lib/supabase/context"
import { redirect } from "next/navigation"
import { InvoiceList } from "@/components/invoicing/InvoiceList"
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

  query = query.order("created_at", { ascending: false })

  const { data: invoices } = await query

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <InvoiceList
        invoices={(invoices ?? []) as Invoice[]}
        searchQuery={search}
        currentStatus={status}
      />
    </div>
  )
}
