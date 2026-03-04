"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Pause, Play, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateRecurringStatus, deleteRecurringInvoice } from "@/lib/actions/recurring"
import type { RecurringInvoice } from "@/lib/types/crm"
import { RECURRING_FREQUENCIES, RECURRING_STATUSES, CURRENCIES } from "@/lib/types/crm"

interface RecurringListProps {
  items: RecurringInvoice[]
}

export function RecurringList({ items }: RecurringListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleStatusToggle = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    startTransition(async () => {
      await updateRecurringStatus(id, newStatus as "ACTIVE" | "PAUSED")
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteRecurringInvoice(id)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push("/invoicing")}
            className="text-[var(--text-muted)] hover:text-[var(--text)] -ml-3 mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Invoices
          </Button>
          <h1 className="font-[family-name:var(--font-display)] text-[2rem] text-[var(--text)] tracking-tight">
            Recurring Invoices
          </h1>
          <p className="text-[0.82rem] text-[var(--text-muted)] font-light mt-1">
            Manage automatic invoice creation schedules.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-8 py-16 text-center">
          <p className="text-[var(--text-muted)] font-light">
            No recurring invoices yet. Open an invoice and click &quot;Make Recurring&quot; to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_100px_120px_80px_100px_80px] gap-2 px-4 py-3 bg-[rgba(26,24,22,0.5)] text-[0.72rem] text-[var(--text-dim)] font-medium uppercase tracking-wider">
            <span>Source Invoice</span>
            <span>Client</span>
            <span>Frequency</span>
            <span>Next Run</span>
            <span>Runs</span>
            <span>Status</span>
            <span></span>
          </div>

          {items.map((item) => {
            const invoice = item.source_invoice
            const sym = CURRENCIES.find(c => c.value === invoice?.currency)?.symbol ?? "$"
            const freqLabel = RECURRING_FREQUENCIES.find(f => f.value === item.frequency)?.label ?? item.frequency
            const statusConfig = RECURRING_STATUSES.find(s => s.value === item.status)

            return (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_120px_100px_120px_80px_100px_80px] gap-2 px-4 py-3 border-t border-[var(--border)] items-center hover:bg-[rgba(232,224,212,0.02)] transition-colors"
              >
                <div>
                  <p className="text-[0.85rem] text-[var(--text)] font-light">
                    {invoice?.invoice_number ?? "—"}
                  </p>
                  {invoice && (
                    <p className="text-[0.72rem] text-[var(--text-dim)]">
                      {sym}{Number(invoice.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>

                <span className="text-[0.82rem] text-[var(--text-muted)] font-light truncate">
                  {invoice?.company?.name ?? invoice?.contact
                    ? `${invoice?.contact?.first_name ?? ""} ${invoice?.contact?.last_name ?? ""}`.trim()
                    : "—"}
                </span>

                <span className="text-[0.82rem] text-[var(--text-muted)] font-light">
                  {freqLabel}
                </span>

                <span className="text-[0.82rem] text-[var(--text-muted)] font-light">
                  {new Date(item.next_run_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>

                <span className="text-[0.82rem] text-[var(--text-muted)] font-light">
                  {item.runs_count}{item.max_runs ? `/${item.max_runs}` : ""}
                </span>

                <span
                  className="inline-flex items-center text-[0.72rem] font-medium px-2.5 py-0.5 rounded-full w-fit"
                  style={{
                    backgroundColor: `${statusConfig?.color ?? "#8A817A"}15`,
                    color: statusConfig?.color ?? "#8A817A",
                  }}
                >
                  {statusConfig?.label ?? item.status}
                </span>

                <div className="flex items-center gap-1 justify-end">
                  {item.status !== "COMPLETED" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleStatusToggle(item.id, item.status)}
                      disabled={isPending}
                      className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)]"
                    >
                      {item.status === "ACTIVE" ? (
                        <Pause className="h-3.5 w-3.5" />
                      ) : (
                        <Play className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={isPending}
                    className="h-7 w-7 text-[var(--text-dim)] hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
