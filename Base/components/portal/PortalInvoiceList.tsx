"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard } from "lucide-react"

interface PortalInvoice {
  id: string
  invoice_number: string
  status: string
  total: number
  currency: string
  issue_date: string
  due_date: string | null
  paid_at: string | null
  share_token: string | null
  payment_url: string | null
}

interface PortalInvoiceListProps {
  invoices: Record<string, unknown>[]
  token: string
}

const STATUS_COLORS: Record<string, string> = {
  SENT: "#5B8DEF",
  PAID: "#5EC69A",
  OVERDUE: "#EF5B5B",
}

export function PortalInvoiceList({ invoices, token }: PortalInvoiceListProps) {
  const items = invoices as unknown as PortalInvoice[]

  if (items.length === 0) {
    return (
      <p className="text-[0.85rem] text-[var(--text-dim)] italic">No invoices yet.</p>
    )
  }

  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", CAD: "$", AUD: "$" }
    return symbols[currency] || "$"
  }

  return (
    <div className="space-y-3">
      {items.map((inv) => {
        const statusColor = STATUS_COLORS[inv.status] || "#8A817A"
        const symbol = getCurrencySymbol(inv.currency)

        return (
          <div
            key={inv.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[0.9rem] font-medium text-[var(--text)]">
                  {inv.invoice_number}
                </span>
                <Badge
                  variant="outline"
                  className="text-[0.65rem] px-2 py-0 border-0 font-medium"
                  style={{ color: statusColor, backgroundColor: `${statusColor}15` }}
                >
                  {inv.status}
                </Badge>
              </div>
              <p className="text-[0.78rem] text-[var(--text-muted)]">
                {symbol}{inv.total.toLocaleString()} · Issued {new Date(inv.issue_date).toLocaleDateString()}
                {inv.due_date && ` · Due ${new Date(inv.due_date).toLocaleDateString()}`}
              </p>
            </div>

            {(inv.status === "SENT" || inv.status === "OVERDUE") && inv.payment_url && (
              <Button
                asChild
                size="sm"
                className="bg-[var(--accent)] text-white hover:opacity-90 gap-1.5"
              >
                <a href={inv.payment_url} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="h-3.5 w-3.5" />
                  Pay Now
                </a>
              </Button>
            )}

            {inv.status === "PAID" && (
              <span className="text-[0.78rem] text-[#5EC69A] font-medium">
                Paid {inv.paid_at && new Date(inv.paid_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
