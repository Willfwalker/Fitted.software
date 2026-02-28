"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LineItemRow } from "./LineItemRow"
import { createInvoice, updateInvoice } from "@/lib/actions/invoices"
import type { Invoice } from "@/lib/types/crm"
import { PAYMENT_TERMS, CURRENCIES } from "@/lib/types/crm"

interface InvoiceFormProps {
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deals: { id: string; title: string; value: number | null; contact_id: string | null; company_id: string | null }[]
  prefillDealId?: string
  invoice?: Invoice
}

const emptyItem = () => ({ description: "", quantity: 1, rate: 0, amount: 0 })
const today = () => new Date().toISOString().split("T")[0]

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00")
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

export function InvoiceForm({ contacts, companies, deals, prefillDealId, invoice }: InvoiceFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!invoice

  // Pre-fill from deal (only for new invoices)
  const prefillDeal = !isEditing && prefillDealId ? deals.find((d) => d.id === prefillDealId) : null

  const [items, setItems] = useState<{ description: string; quantity: number; rate: number; amount: number }[]>(
    invoice
      ? (invoice.items as { description: string; quantity: number; rate: number; amount: number }[])
      : prefillDeal?.value
        ? [{ description: prefillDeal.title, quantity: 1, rate: Number(prefillDeal.value), amount: Number(prefillDeal.value) }]
        : [emptyItem()]
  )
  const [taxRate, setTaxRate] = useState(invoice?.tax_rate ?? 0)
  const [issueDate, setIssueDate] = useState(invoice?.issue_date ? invoice.issue_date.split("T")[0] : today())
  const [dueDate, setDueDate] = useState(invoice?.due_date ? invoice.due_date.split("T")[0] : "")
  const [paymentTerms, setPaymentTerms] = useState(invoice?.payment_terms ?? "DUE_ON_RECEIPT")
  const [currency, setCurrency] = useState(invoice?.currency ?? "USD")
  const [discountType, setDiscountType] = useState<"percentage" | "flat" | "none">(invoice?.discount_type ?? "none")
  const [discountValue, setDiscountValue] = useState(invoice?.discount_value ?? 0)
  const [contactId, setContactId] = useState(invoice?.contact_id ?? prefillDeal?.contact_id ?? "")
  const [companyId, setCompanyId] = useState(invoice?.company_id ?? prefillDeal?.company_id ?? "")
  const [dealId, setDealId] = useState(invoice?.deal_id ?? prefillDealId ?? "")
  const [notes, setNotes] = useState(invoice?.notes ?? "")

  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol ?? "$"

  // Auto-calculate due date when payment terms or issue date changes
  useEffect(() => {
    if (paymentTerms === "CUSTOM") return
    const term = PAYMENT_TERMS.find(t => t.value === paymentTerms)
    if (term && term.days !== null && issueDate) {
      if (term.days === 0) {
        setDueDate(issueDate)
      } else {
        setDueDate(addDays(issueDate, term.days))
      }
    }
  }, [paymentTerms, issueDate])

  const updateItem = (index: number, field: string, value: string | number) => {
    setItems((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      if (field === "quantity" || field === "rate") {
        next[index].amount = Number((next[index].quantity * next[index].rate).toFixed(2))
      }
      return next
    })
  }

  const addItem = () => setItems((prev) => [...prev, emptyItem()])
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  // Totals calculation with discount
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const discountAmount = discountType === "percentage"
    ? Number((subtotal * discountValue / 100).toFixed(2))
    : discountType === "flat"
      ? Math.min(discountValue, subtotal)
      : 0
  const taxable = subtotal - discountAmount
  const taxAmount = Number((taxable * (taxRate / 100)).toFixed(2))
  const total = Number((taxable + taxAmount).toFixed(2))

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const payload = {
        items,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        discount_type: (discountType !== "none" ? discountType : null) as "percentage" | "flat" | null | undefined,
        discount_value: discountValue,
        payment_terms: paymentTerms,
        currency,
        contact_id: contactId || undefined,
        company_id: companyId || undefined,
        deal_id: dealId || undefined,
        notes: notes || undefined,
      }

      const result = isEditing
        ? await updateInvoice(invoice.id, payload)
        : await createInvoice(payload)

      if (result.error) {
        setError(result.error)
      } else if (isEditing) {
        router.push(`/dashboard/invoicing/${invoice.id}`)
      } else if (result.invoiceId) {
        router.push(`/dashboard/invoicing/${result.invoiceId}`)
      }
    })
  }

  return (
    <div className="max-w-[800px] space-y-6">
      {/* SENT warning banner */}
      {isEditing && invoice.status === "SENT" && (
        <div className="flex items-start gap-3 rounded-xl border border-[rgba(232,168,76,0.3)] bg-[rgba(232,168,76,0.06)] px-5 py-4">
          <AlertTriangle className="h-4 w-4 text-[#E8A84C] mt-0.5 shrink-0" />
          <p className="text-[0.82rem] text-[#E8A84C] font-light">
            This invoice has been sent. Changes will not be reflected in any previously shared copies.
          </p>
        </div>
      )}

      {/* Relationships + Dates */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-4">
        <h2 className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Invoice Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue placeholder="Select company" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Deal</Label>
            <Select value={dealId} onValueChange={setDealId}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue placeholder="Link to deal" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {deals.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {d.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Issue Date</Label>
            <Input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Payment Terms</Label>
            <Select value={paymentTerms} onValueChange={setPaymentTerms}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {PAYMENT_TERMS.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Due Date</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value)
                setPaymentTerms("CUSTOM")
              }}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Tax Rate (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate || ""}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-4">
        <h2 className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Line Items
        </h2>

        {/* Header */}
        <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 text-[0.72rem] text-[var(--text-dim)] font-medium uppercase tracking-wider">
          <span>Description</span>
          <span>Qty</span>
          <span>Rate</span>
          <span className="text-right">Amount</span>
          <span />
        </div>

        {items.map((item, i) => (
          <LineItemRow
            key={i}
            index={i}
            item={item}
            onChange={updateItem}
            onRemove={removeItem}
            canRemove={items.length > 1}
          />
        ))}

        <Button
          type="button"
          variant="ghost"
          onClick={addItem}
          className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Item
        </Button>

        {/* Discount */}
        <div className="border-t border-[var(--border)] pt-4 space-y-3">
          <h3 className="text-[0.78rem] font-medium text-[var(--text-dim)] uppercase tracking-wider">Discount</h3>
          <div className="grid grid-cols-[160px_1fr] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percentage" | "flat" | "none")}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue placeholder="No discount" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  <SelectItem value="none" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">No discount</SelectItem>
                  <SelectItem value="percentage" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Percentage (%)</SelectItem>
                  <SelectItem value="flat" className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">Flat amount ({currencySymbol})</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {discountType && discountType !== "none" && (
              <div className="space-y-1.5">
                <Label className="text-[0.78rem] text-[var(--text-muted)]">
                  {discountType === "percentage" ? "Percentage" : "Amount"}
                </Label>
                <Input
                  type="number"
                  min="0"
                  max={discountType === "percentage" ? 100 : undefined}
                  step="0.01"
                  value={discountValue || ""}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-[var(--border)] pt-4 space-y-2">
          <div className="flex justify-between text-[0.85rem]">
            <span className="text-[var(--text-muted)] font-light">Subtotal</span>
            <span className="text-[var(--text)] font-light">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-[0.85rem]">
              <span className="text-[var(--text-muted)] font-light">
                Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
              </span>
              <span className="text-[#5EC69A] font-light">-{currencySymbol}{discountAmount.toFixed(2)}</span>
            </div>
          )}
          {taxRate > 0 && (
            <div className="flex justify-between text-[0.85rem]">
              <span className="text-[var(--text-muted)] font-light">Tax ({taxRate}%)</span>
              <span className="text-[var(--text)] font-light">{currencySymbol}{taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[1rem] pt-1 border-t border-[var(--border)]">
            <span className="text-[var(--text)] font-medium">Total</span>
            <span className="text-[var(--text)] font-[family-name:var(--font-display)] text-[1.2rem]">
              {currencySymbol}{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[0.78rem] text-[var(--text-muted)]">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Payment terms, additional notes..."
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-[0.82rem] text-red-400">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="text-[var(--text-muted)] hover:text-[var(--text)]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || items.every((i) => !i.description)}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
        >
          {isPending
            ? isEditing ? "Saving..." : "Creating..."
            : isEditing ? "Save Changes" : "Create Invoice"
          }
        </Button>
      </div>
    </div>
  )
}
