"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { invoiceSchema, sendInvoiceEmailSchema } from "@/lib/validations/crm"
import { renderToBuffer } from "@react-pdf/renderer"
import { InvoicePDFDocument } from "@/lib/pdf/invoice-template"
import { buildInvoiceEmailHtml } from "@/lib/email/invoice-email"
import { Resend } from "resend"
import type { InvoiceStatus } from "@/lib/types/crm"

const resend = new Resend(process.env.RESEND_API_KEY)

export type InvoiceActionState = {
  error?: string
  success?: boolean
  invoiceId?: string
  shareToken?: string
}

// Valid status transitions
const VALID_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["PAID", "OVERDUE", "CANCELLED"],
  OVERDUE: ["PAID", "CANCELLED"],
  PAID: [],
  CANCELLED: ["DRAFT"],
}

function recalcTotals(items: { quantity: number; rate: number }[], taxRate: number, discountType: "percentage" | "flat" | null, discountValue: number) {
  const subtotal = items.reduce((sum, item) => sum + Number((item.quantity * item.rate).toFixed(2)), 0)
  const discountAmount = discountType === "percentage"
    ? Number((subtotal * discountValue / 100).toFixed(2))
    : discountType === "flat"
      ? Math.min(discountValue, subtotal)
      : 0
  const taxable = subtotal - discountAmount
  const taxAmount = Number((taxable * taxRate / 100).toFixed(2))
  const total = Number((taxable + taxAmount).toFixed(2))
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount_amount: Number(discountAmount.toFixed(2)),
    tax_amount: taxAmount,
    total,
    items: items.map(item => ({
      ...item,
      amount: Number((item.quantity * item.rate).toFixed(2)),
    })),
  }
}

export async function createInvoice(
  data: {
    items: { description: string; quantity: number; rate: number; amount: number }[]
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    issue_date: string
    due_date?: string
    discount_type?: "percentage" | "flat" | null
    discount_value?: number
    payment_terms?: string
    currency?: string
    contact_id?: string
    company_id?: string
    deal_id?: string
    notes?: string
  }
): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = invoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Server-side recalculation — don't trust client totals
  const calc = recalcTotals(d.items, d.tax_rate, d.discount_type ?? null, d.discount_value)

  // Get next invoice number atomically
  const { data: numResult, error: numError } = await supabase
    .rpc("next_invoice_number", { p_org_id: ctx.orgId })

  if (numError || !numResult) return { error: numError?.message || "Failed to generate invoice number" }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      org_id: ctx.orgId,
      invoice_number: numResult,
      deal_id: d.deal_id || null,
      contact_id: d.contact_id || null,
      company_id: d.company_id || null,
      status: "DRAFT" as InvoiceStatus,
      items: calc.items,
      subtotal: calc.subtotal,
      tax_rate: d.tax_rate,
      tax_amount: calc.tax_amount,
      total: calc.total,
      issue_date: d.issue_date,
      due_date: d.due_date || null,
      discount_type: d.discount_type || null,
      discount_value: d.discount_value || 0,
      discount_amount: calc.discount_amount,
      payment_terms: d.payment_terms || "DUE_ON_RECEIPT",
      currency: d.currency || "USD",
      notes: d.notes || null,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: d.deal_id || null,
    contact_id: d.contact_id || null,
    company_id: d.company_id || null,
    type: "INVOICE_CREATED",
    title: `Created invoice ${numResult}`,
    metadata: { invoice_id: invoice.id, total: calc.total },
    created_by: ctx.userId,
  })

  revalidatePath("/dashboard/invoicing")
  return { success: true, invoiceId: invoice.id }
}

export async function updateInvoice(
  id: string,
  data: {
    items: { description: string; quantity: number; rate: number; amount: number }[]
    subtotal: number
    tax_rate: number
    tax_amount: number
    total: number
    issue_date: string
    due_date?: string
    discount_type?: "percentage" | "flat" | null
    discount_value?: number
    payment_terms?: string
    currency?: string
    contact_id?: string
    company_id?: string
    deal_id?: string
    notes?: string
  }
): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = invoiceSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Edit lock — check current status
  const { data: current } = await supabase
    .from("invoices")
    .select("status")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!current) return { error: "Invoice not found" }
  if (current.status === "PAID") return { error: "Cannot edit a paid invoice" }
  if (current.status === "CANCELLED") return { error: "Cannot edit a cancelled invoice" }

  // Server-side recalculation
  const calc = recalcTotals(d.items, d.tax_rate, d.discount_type ?? null, d.discount_value)

  const { error } = await supabase
    .from("invoices")
    .update({
      deal_id: d.deal_id || null,
      contact_id: d.contact_id || null,
      company_id: d.company_id || null,
      items: calc.items,
      subtotal: calc.subtotal,
      tax_rate: d.tax_rate,
      tax_amount: calc.tax_amount,
      total: calc.total,
      issue_date: d.issue_date,
      due_date: d.due_date || null,
      discount_type: d.discount_type || null,
      discount_value: d.discount_value || 0,
      discount_amount: calc.discount_amount,
      payment_terms: d.payment_terms || "DUE_ON_RECEIPT",
      currency: d.currency || "USD",
      notes: d.notes || null,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/invoicing")
  revalidatePath(`/dashboard/invoicing/${id}`)
  return { success: true }
}

export async function updateInvoiceStatus(
  id: string,
  newStatus: InvoiceStatus
): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get current invoice
  const { data: invoice } = await supabase
    .from("invoices")
    .select("status, invoice_number, contact_id, company_id, deal_id")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!invoice) return { error: "Invoice not found" }

  // Validate status transition
  const currentStatus = invoice.status as InvoiceStatus
  const allowed = VALID_TRANSITIONS[currentStatus]
  if (!allowed || !allowed.includes(newStatus)) {
    return { error: `Cannot change status from ${currentStatus} to ${newStatus}` }
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (newStatus === "PAID") {
    updateData.paid_at = new Date().toISOString()
  }
  // Clear paid_at if re-opening from CANCELLED to DRAFT
  if (newStatus === "DRAFT" && currentStatus === "CANCELLED") {
    updateData.paid_at = null
  }

  const { error } = await supabase
    .from("invoices")
    .update(updateData)
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: invoice.deal_id,
    contact_id: invoice.contact_id,
    company_id: invoice.company_id,
    type: "INVOICE_STATUS_CHANGED",
    title: `Invoice ${invoice.invoice_number} marked as ${newStatus}`,
    metadata: { invoice_id: id, from: invoice.status, to: newStatus },
    created_by: ctx.userId,
  })

  revalidatePath("/dashboard/invoicing")
  revalidatePath(`/dashboard/invoicing/${id}`)
  return { success: true }
}

export async function deleteInvoice(id: string): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Check status before delete
  const { data: invoice } = await supabase
    .from("invoices")
    .select("status, invoice_number, contact_id, company_id, deal_id")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!invoice) return { error: "Invoice not found" }

  // Only allow hard delete for DRAFT
  if (invoice.status !== "DRAFT") {
    return { error: "Only draft invoices can be deleted. Use Cancel to void sent invoices." }
  }

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: invoice.deal_id,
    contact_id: invoice.contact_id,
    company_id: invoice.company_id,
    type: "INVOICE_STATUS_CHANGED",
    title: `Invoice ${invoice.invoice_number} deleted`,
    metadata: { invoice_id: id, action: "deleted" },
    created_by: ctx.userId,
  })

  revalidatePath("/dashboard/invoicing")
  return { success: true }
}

export async function duplicateInvoice(id: string): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Fetch source invoice
  const { data: source } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!source) return { error: "Invoice not found" }

  // Get next invoice number
  const { data: numResult, error: numError } = await supabase
    .rpc("next_invoice_number", { p_org_id: ctx.orgId })

  if (numError || !numResult) return { error: numError?.message || "Failed to generate invoice number" }

  const today = new Date().toISOString().split("T")[0]

  const { data: newInvoice, error } = await supabase
    .from("invoices")
    .insert({
      org_id: ctx.orgId,
      invoice_number: numResult,
      deal_id: source.deal_id,
      contact_id: source.contact_id,
      company_id: source.company_id,
      status: "DRAFT" as InvoiceStatus,
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
    type: "INVOICE_CREATED",
    title: `Duplicated invoice ${source.invoice_number} → ${numResult}`,
    metadata: { invoice_id: newInvoice.id, source_invoice_id: id, total: source.total },
    created_by: ctx.userId,
  })

  revalidatePath("/dashboard/invoicing")
  return { success: true, invoiceId: newInvoice.id }
}

export async function generateShareToken(id: string): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Check if token already exists
  const { data: existing } = await supabase
    .from("invoices")
    .select("share_token")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!existing) return { error: "Invoice not found" }

  if (existing.share_token) {
    return { success: true, shareToken: existing.share_token }
  }

  // Generate new token
  const token = crypto.randomUUID()
  const { error } = await supabase
    .from("invoices")
    .update({ share_token: token })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/invoicing/${id}`)
  return { success: true, shareToken: token }
}

export async function sendInvoiceEmail(data: {
  invoiceId: string
  recipientEmail: string
  recipientName?: string
  message?: string
}): Promise<InvoiceActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = sendInvoiceEmailSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { invoiceId, recipientEmail, recipientName, message } = parsed.data
  const supabase = await createClient()

  // Fetch invoice with joins
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, contact:contacts(id, first_name, last_name, email), company:companies(id, name, address, email)")
    .eq("id", invoiceId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!invoice) return { error: "Invoice not found" }

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", ctx.orgId)
    .single()

  const orgName = org?.name ?? "Company"

  // Ensure share token exists
  let shareToken = invoice.share_token
  if (!shareToken) {
    shareToken = crypto.randomUUID()
    await supabase
      .from("invoices")
      .update({ share_token: shareToken })
      .eq("id", invoiceId)
      .eq("org_id", ctx.orgId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const shareUrl = `${appUrl}/invoice/${shareToken}`

  // Generate PDF
  const contact = invoice.contact as { first_name: string; last_name: string; email: string | null } | null
  const company = invoice.company as { name: string; address: string | null } | null

  const pdfBuffer = await renderToBuffer(
    InvoicePDFDocument({
      orgName,
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

  // Build email HTML
  const html = buildInvoiceEmailHtml({
    orgName,
    invoiceNumber: invoice.invoice_number,
    total: invoice.total,
    currency: invoice.currency,
    dueDate: invoice.due_date,
    shareUrl,
    recipientName: recipientName || undefined,
    customMessage: message || undefined,
  })

  const resendDomain = process.env.RESEND_DOMAIN || "resend.dev"

  // Send email via Resend
  const { error: sendError } = await resend.emails.send({
    from: `${orgName} <invoices@${resendDomain}>`,
    to: recipientEmail,
    subject: `Invoice ${invoice.invoice_number} from ${orgName}`,
    html,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: Buffer.from(pdfBuffer).toString("base64"),
      },
    ],
  })

  if (sendError) return { error: sendError.message }

  // Auto-transition DRAFT → SENT
  if (invoice.status === "DRAFT") {
    await supabase
      .from("invoices")
      .update({ status: "SENT" })
      .eq("id", invoiceId)
      .eq("org_id", ctx.orgId)
  }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: invoice.deal_id,
    contact_id: invoice.contact_id,
    company_id: invoice.company_id,
    type: "INVOICE_SENT",
    title: `Invoice ${invoice.invoice_number} sent to ${recipientEmail}`,
    metadata: { invoice_id: invoiceId, recipient: recipientEmail },
    created_by: ctx.userId,
  })

  revalidatePath("/dashboard/invoicing")
  revalidatePath(`/dashboard/invoicing/${invoiceId}`)
  return { success: true }
}
