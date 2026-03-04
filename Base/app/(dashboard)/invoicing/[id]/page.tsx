import { getServerContext } from "@/lib/supabase/context"
import { redirect, notFound } from "next/navigation"
import { InvoiceDetail } from "@/components/invoicing/InvoiceDetail"
import type { Invoice } from "@/lib/types/crm"

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const { id } = await params

  const { data: invoice } = await ctx.supabase
    .from("invoices")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name, email, address), deal:deals(id, title)")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!invoice) notFound()

  // Get org name for PDF/email
  const { data: org } = await ctx.supabase
    .from("organizations")
    .select("name")
    .eq("id", ctx.orgId)
    .single()

  return (
    <div className="p-8 lg:p-12 max-w-[900px]">
      <InvoiceDetail
        invoice={invoice as unknown as Invoice}
        orgName={org?.name ?? "Company"}
      />
    </div>
  )
}
