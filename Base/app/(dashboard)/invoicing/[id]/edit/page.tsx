import { getServerContext } from "@/lib/supabase/context"
import { redirect, notFound } from "next/navigation"
import { InvoiceForm } from "@/components/invoicing/InvoiceForm"
import type { Invoice } from "@/lib/types/crm"

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const ctx = await getServerContext()
  if (!ctx) redirect("/login")

  const { id } = await params

  const [invoiceRes, contactsRes, companiesRes, dealsRes] = await Promise.all([
    ctx.supabase
      .from("invoices")
      .select("*, contact:contacts(id, first_name, last_name), company:companies(id, name), deal:deals(id, title)")
      .eq("id", id)
      .eq("org_id", ctx.orgId)
      .single(),
    ctx.supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("org_id", ctx.orgId)
      .order("first_name"),
    ctx.supabase
      .from("companies")
      .select("id, name")
      .eq("org_id", ctx.orgId)
      .order("name"),
    ctx.supabase
      .from("deals")
      .select("id, title, value, contact_id, company_id")
      .eq("org_id", ctx.orgId)
      .order("created_at", { ascending: false }),
  ])

  const invoice = invoiceRes.data as unknown as Invoice | null
  if (!invoice) notFound()

  // Block editing paid or cancelled invoices
  if (invoice.status === "PAID" || invoice.status === "CANCELLED") {
    redirect(`/invoicing/${id}`)
  }

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Invoicing
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Edit {invoice.invoice_number}
        </h1>
      </div>

      <InvoiceForm
        contacts={contactsRes.data ?? []}
        companies={companiesRes.data ?? []}
        deals={(dealsRes.data ?? []) as { id: string; title: string; value: number | null; contact_id: string | null; company_id: string | null }[]}
        invoice={invoice}
      />
    </div>
  )
}
