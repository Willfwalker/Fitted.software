"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send, CheckCircle, XCircle, Trash2, Pencil, Copy, RotateCcw, AlertTriangle, Repeat, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import { DownloadPDFButton } from "./DownloadPDFButton"
import { ShareLinkButton } from "./ShareLinkButton"
import { SendInvoiceModal } from "./SendInvoiceModal"
import { RecurringInvoiceModal } from "./RecurringInvoiceModal"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { updateInvoiceStatus, deleteInvoice, duplicateInvoice } from "@/lib/actions/invoices"
import type { Invoice, InvoiceStatus } from "@/lib/types/crm"
import { PAYMENT_TERMS, CURRENCIES } from "@/lib/types/crm"

interface InvoiceDetailProps {
  invoice: Invoice
  orgName?: string
}

export function InvoiceDetail({ invoice, orgName }: InvoiceDetailProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDelete, setShowDelete] = useState(false)
  const [showSend, setShowSend] = useState(false)
  const [showRecurring, setShowRecurring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currencySymbol = CURRENCIES.find(c => c.value === invoice.currency)?.symbol ?? "$"
  const paymentTermLabel = PAYMENT_TERMS.find(t => t.value === invoice.payment_terms)?.label ?? invoice.payment_terms

  // Overdue check: SENT and past due
  const isOverdue = invoice.status === "SENT" && invoice.due_date && new Date(invoice.due_date) < new Date(new Date().toDateString())

  const handleStatusChange = (newStatus: InvoiceStatus) => {
    setError(null)
    startTransition(async () => {
      const result = await updateInvoiceStatus(invoice.id, newStatus)
      if (result.error) setError(result.error)
    })
  }

  const handleDelete = async () => {
    const result = await deleteInvoice(invoice.id)
    if (result.error) {
      setError(result.error)
      setShowDelete(false)
    } else {
      router.push("/invoicing")
    }
  }

  const handleDuplicate = () => {
    setError(null)
    startTransition(async () => {
      const result = await duplicateInvoice(invoice.id)
      if (result.error) {
        setError(result.error)
      } else if (result.invoiceId) {
        router.push(`/invoicing/${result.invoiceId}`)
      }
    })
  }

  const canEdit = invoice.status === "DRAFT" || invoice.status === "SENT"
  const canDelete = invoice.status === "DRAFT"
  const canCancel = invoice.status === "SENT" || invoice.status === "OVERDUE"
  const canReopen = invoice.status === "CANCELLED"
  const canMakeRecurring = invoice.status !== "CANCELLED"

  // Contact email for pre-filling send modal
  const contactEmail = invoice.contact?.email ?? null
  const contactName = invoice.contact
    ? `${invoice.contact.first_name} ${invoice.contact.last_name}`
    : null

  return (
    <>
      <div className="space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/invoicing")}
            className="text-[var(--text-muted)] hover:text-[var(--text)] -ml-3"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* PDF download — always visible */}
            <DownloadPDFButton invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} />

            {/* Share link */}
            <ShareLinkButton invoiceId={invoice.id} existingToken={invoice.share_token} />

            {/* Send email */}
            <Button
              variant="ghost"
              onClick={() => setShowSend(true)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Send
            </Button>

            {/* Edit button */}
            {canEdit && (
              <Button
                variant="ghost"
                onClick={() => router.push(`/invoicing/${invoice.id}/edit`)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}

            {/* Duplicate button */}
            <Button
              variant="ghost"
              onClick={handleDuplicate}
              disabled={isPending}
              className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicate
            </Button>

            {/* Make Recurring */}
            {canMakeRecurring && (
              <Button
                variant="ghost"
                onClick={() => setShowRecurring(true)}
                className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
              >
                <Repeat className="h-3.5 w-3.5 mr-1.5" />
                Recurring
              </Button>
            )}

            {/* Status actions */}
            {invoice.status === "DRAFT" && (
              <Button
                onClick={() => handleStatusChange("SENT")}
                disabled={isPending}
                className="bg-[#5B8DEF] hover:bg-[#4A7CE0] text-white rounded-full px-5 text-[0.82rem]"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Mark as Sent
              </Button>
            )}
            {(invoice.status === "SENT" || invoice.status === "OVERDUE") && (
              <Button
                onClick={() => handleStatusChange("PAID")}
                disabled={isPending}
                className="bg-[#5EC69A] hover:bg-[#4DB589] text-white rounded-full px-5 text-[0.82rem]"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                Mark as Paid
              </Button>
            )}
            {canCancel && (
              <Button
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={isPending}
                variant="ghost"
                className="text-[var(--text-dim)] hover:text-red-400 text-[0.82rem]"
              >
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                Cancel Invoice
              </Button>
            )}
            {canReopen && (
              <Button
                onClick={() => handleStatusChange("DRAFT")}
                disabled={isPending}
                variant="ghost"
                className="text-[var(--text-dim)] hover:text-[var(--text)] text-[0.82rem]"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                Re-open as Draft
              </Button>
            )}

            {/* Delete — DRAFT only */}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDelete(true)}
                className="text-[var(--text-dim)] hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-[rgba(239,91,91,0.3)] bg-[rgba(239,91,91,0.06)] px-5 py-3">
            <p className="text-[0.82rem] text-red-400 font-light">{error}</p>
          </div>
        )}

        {/* Invoice card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-[2rem] text-[var(--text)] tracking-tight">
                {invoice.invoice_number}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={invoice.status as InvoiceStatus} />
                {isOverdue && (
                  <span className="inline-flex items-center gap-1 text-[0.72rem] font-medium px-2 py-0.5 rounded-full bg-[rgba(239,91,91,0.1)] text-[#EF5B5B]">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">
                Total
              </p>
              <p className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] leading-none tracking-tight">
                {currencySymbol}{Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {invoice.company && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Company</p>
                <p className="text-[0.88rem] text-[var(--text)] font-light">{invoice.company.name}</p>
              </div>
            )}
            {invoice.contact && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Contact</p>
                <p className="text-[0.88rem] text-[var(--text)] font-light">
                  {invoice.contact.first_name} {invoice.contact.last_name}
                </p>
              </div>
            )}
            {invoice.deal && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Deal</p>
                <p className="text-[0.88rem] text-[var(--text)] font-light">{invoice.deal.title}</p>
              </div>
            )}
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Issue Date</p>
              <p className="text-[0.88rem] text-[var(--text)] font-light">
                {new Date(invoice.issue_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Due Date</p>
                <p className={`text-[0.88rem] font-light ${isOverdue ? "text-[#EF5B5B]" : "text-[var(--text)]"}`}>
                  {new Date(invoice.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Payment Terms</p>
              <p className="text-[0.88rem] text-[var(--text)] font-light">{paymentTermLabel}</p>
            </div>
            {invoice.paid_at && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Paid</p>
                <p className="text-[0.88rem] text-[var(--text)] font-light">
                  {new Date(invoice.paid_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
            {invoice.currency !== "USD" && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Currency</p>
                <p className="text-[0.88rem] text-[var(--text)] font-light">{invoice.currency}</p>
              </div>
            )}
          </div>

          {/* Line items table */}
          <div className="border-t border-[var(--border)] pt-6">
            <div className="grid grid-cols-[1fr_80px_100px_100px] gap-2 text-[0.72rem] text-[var(--text-dim)] font-medium uppercase tracking-wider mb-3">
              <span>Description</span>
              <span>Qty</span>
              <span>Rate</span>
              <span className="text-right">Amount</span>
            </div>
            {(invoice.items as { description: string; quantity: number; rate: number; amount: number }[]).map((item, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_100px] gap-2 py-2 border-t border-[rgba(42,37,32,0.3)]">
                <span className="text-[0.85rem] text-[var(--text)] font-light">{item.description}</span>
                <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{item.quantity}</span>
                <span className="text-[0.85rem] text-[var(--text-muted)] font-light">{currencySymbol}{Number(item.rate).toFixed(2)}</span>
                <span className="text-[0.85rem] text-[var(--text)] font-light text-right">{currencySymbol}{Number(item.amount).toFixed(2)}</span>
              </div>
            ))}

            {/* Totals */}
            <div className="border-t border-[var(--border)] pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-[0.85rem]">
                <span className="text-[var(--text-muted)] font-light">Subtotal</span>
                <span className="text-[var(--text)] font-light">{currencySymbol}{Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-[0.85rem]">
                  <span className="text-[var(--text-muted)] font-light">
                    Discount {invoice.discount_type === "percentage" ? `(${invoice.discount_value}%)` : ""}
                  </span>
                  <span className="text-[#5EC69A] font-light">-{currencySymbol}{Number(invoice.discount_amount).toFixed(2)}</span>
                </div>
              )}
              {Number(invoice.tax_rate) > 0 && (
                <div className="flex justify-between text-[0.85rem]">
                  <span className="text-[var(--text-muted)] font-light">Tax ({invoice.tax_rate}%)</span>
                  <span className="text-[var(--text)] font-light">{currencySymbol}{Number(invoice.tax_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-[1rem] pt-2 border-t border-[var(--border)]">
                <span className="text-[var(--text)] font-medium">Total</span>
                <span className="text-[var(--text)] font-[family-name:var(--font-display)] text-[1.3rem]">
                  {currencySymbol}{Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="border-t border-[var(--border)] pt-6">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-2">Notes</p>
              <p className="text-[0.85rem] text-[var(--text-muted)] font-light whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.invoice_number}? This action cannot be undone.`}
      />

      <SendInvoiceModal
        open={showSend}
        onOpenChange={setShowSend}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoice_number}
        defaultEmail={contactEmail}
        defaultName={contactName}
      />

      <RecurringInvoiceModal
        open={showRecurring}
        onOpenChange={setShowRecurring}
        invoiceId={invoice.id}
        invoiceNumber={invoice.invoice_number}
      />
    </>
  )
}
