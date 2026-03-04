"use client"

import { FileDown, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./StatusBadge"
import type { Invoice, InvoiceStatus } from "@/lib/types/crm"
import { PAYMENT_TERMS, CURRENCIES } from "@/lib/types/crm"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PublicInvoiceViewProps {
  invoice: Invoice
  orgName: string
  shareToken: string
}

export function PublicInvoiceView({ invoice, orgName, shareToken }: PublicInvoiceViewProps) {
  const currencySymbol = CURRENCIES.find(c => c.value === invoice.currency)?.symbol ?? "$"
  const paymentTermLabel = PAYMENT_TERMS.find(t => t.value === invoice.payment_terms)?.label ?? invoice.payment_terms

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-[family-name:var(--font-display)] text-[1.5rem] text-[var(--text)] tracking-tight">
            {orgName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/invoices/public/${shareToken}/pdf`}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[0.82rem] font-light text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[rgba(232,224,212,0.03)] transition-colors"
          >
            <FileDown className="h-3.5 w-3.5" />
            Download PDF
          </a>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  disabled
                  className="bg-[rgba(94,198,154,0.15)] text-[#5EC69A] rounded-full px-5 text-[0.82rem] cursor-not-allowed opacity-60"
                >
                  <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                  Pay Now
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-muted)]">
                <p>Online payments coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

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
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Issue Date</p>
            <p className="text-[0.88rem] text-[var(--text)] font-light">
              {new Date(invoice.issue_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {invoice.due_date && (
            <div>
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Due Date</p>
              <p className="text-[0.88rem] text-[var(--text)] font-light">
                {new Date(invoice.due_date + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
          <div>
            <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-1">Payment Terms</p>
            <p className="text-[0.88rem] text-[var(--text)] font-light">{paymentTermLabel}</p>
          </div>
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

      {/* Footer */}
      <p className="text-center text-[0.72rem] text-[var(--text-dim)]">
        Powered by {orgName}
      </p>
    </div>
  )
}
