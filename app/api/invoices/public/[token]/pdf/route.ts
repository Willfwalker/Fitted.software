import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { createAdminClient } from "@/lib/supabase/admin"
import { InvoicePDFDocument } from "@/lib/pdf/invoice-template"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createAdminClient()

  const { data: invoice, error } = await supabase
    .from("invoices")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name, address, email)")
    .eq("share_token", token)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
  }

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", invoice.org_id)
    .single()

  const contact = invoice.contact as { first_name: string; last_name: string; email: string | null } | null
  const company = invoice.company as { name: string; address: string | null } | null

  const buffer = await renderToBuffer(
    InvoicePDFDocument({
      orgName: org?.name ?? "Company",
      invoiceNumber: invoice.invoice_number,
      status: invoice.status,
      issueDate: invoice.issue_date,
      dueDate: invoice.due_date,
      paymentTerms: invoice.payment_terms,
      currency: invoice.currency,
      companyName: company?.name ?? null,
      companyAddress: company?.address ?? null,
      contactName: contact ? `${contact.first_name} ${contact.last_name}` : null,
      contactEmail: contact?.email ?? null,
      items: invoice.items,
      subtotal: invoice.subtotal,
      discountType: invoice.discount_type,
      discountValue: invoice.discount_value,
      discountAmount: invoice.discount_amount,
      taxRate: invoice.tax_rate,
      taxAmount: invoice.tax_amount,
      total: invoice.total,
      notes: invoice.notes,
    })
  )

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
