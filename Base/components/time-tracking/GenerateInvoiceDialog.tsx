"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { generateInvoiceFromTime } from "@/lib/actions/time-entries"
import type { TimeEntry } from "@/lib/types/time-tracking"

interface GenerateInvoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entries: TimeEntry[]
  contactId?: string
  companyId?: string
  dealId?: string
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  entries,
  contactId,
  companyId,
  dealId,
}: GenerateInvoiceDialogProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(entries.filter((e) => !e.invoice_id && e.billable).map((e) => e.id))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const unbilledEntries = entries.filter((e) => !e.invoice_id && e.billable)

  const toggleEntry = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === unbilledEntries.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(unbilledEntries.map((e) => e.id)))
    }
  }

  const totalMinutes = unbilledEntries
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + e.duration_minutes, 0)
  const totalAmount = unbilledEntries
    .filter((e) => selected.has(e.id))
    .reduce((sum, e) => sum + (e.duration_minutes / 60) * (e.rate || 0), 0)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)

    const result = await generateInvoiceFromTime(
      Array.from(selected),
      contactId,
      companyId,
      dealId
    )

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onOpenChange(false)
      router.push(`/invoicing/${result.invoiceId}`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[var(--text)]">
            Generate Invoice from Time
          </DialogTitle>
        </DialogHeader>

        {unbilledEntries.length === 0 ? (
          <p className="text-[0.85rem] text-[var(--text-muted)]">
            No unbilled billable time entries available.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Checkbox
                checked={selected.size === unbilledEntries.length}
                onCheckedChange={toggleAll}
              />
              <span className="text-[0.8rem] text-[var(--text-muted)]">Select all</span>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-1.5">
              {unbilledEntries.map((entry) => (
                <label
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-2.5 cursor-pointer hover:bg-[var(--bg-elevated)]"
                >
                  <Checkbox
                    checked={selected.has(entry.id)}
                    onCheckedChange={() => toggleEntry(entry.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[0.8rem] text-[var(--text)] truncate">
                      {entry.description || "Time entry"}
                    </p>
                    <p className="text-[0.72rem] text-[var(--text-dim)]">
                      {(entry.duration_minutes / 60).toFixed(1)}h @ ${entry.rate}/hr
                    </p>
                  </div>
                  <span className="text-[0.8rem] text-[var(--text-muted)] shrink-0">
                    ${((entry.duration_minutes / 60) * (entry.rate || 0)).toFixed(2)}
                  </span>
                </label>
              ))}
            </div>

            <div className="border-t border-[var(--border)] pt-3 mt-2">
              <div className="flex justify-between text-[0.85rem]">
                <span className="text-[var(--text-muted)]">
                  {selected.size} entries / {(totalMinutes / 60).toFixed(1)}h
                </span>
                <span className="font-medium text-[var(--text)]">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="text-[var(--text-muted)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={loading || selected.size === 0}
                className="bg-[var(--accent)] text-white hover:opacity-90"
              >
                {loading ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
