import { notFound } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { PublicInvoiceView } from "@/components/invoicing/PublicInvoiceView"
import type { Invoice } from "@/lib/types/crm"

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name, address, email)")
    .eq("share_token", token)
    .single()

  if (!invoice) notFound()

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", invoice.org_id)
    .single()

  return (
    <PublicInvoiceView
      invoice={invoice as unknown as Invoice}
      orgName={org?.name ?? "Company"}
      shareToken={token}
    />
  )
}
