"use client"

import { useState, useTransition } from "react"
import { Repeat, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createRecurringInvoice } from "@/lib/actions/recurring"
import { RECURRING_FREQUENCIES, type RecurringFrequency } from "@/lib/types/crm"

interface RecurringInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceId: string
  invoiceNumber: string
}

export function RecurringInvoiceModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
}: RecurringInvoiceModalProps) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultStart = tomorrow.toISOString().split("T")[0]

  const [frequency, setFrequency] = useState<RecurringFrequency>("MONTHLY")
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState("")
  const [maxRuns, setMaxRuns] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const frequencyLabel = RECURRING_FREQUENCIES.find(f => f.value === frequency)?.label?.toLowerCase() ?? frequency.toLowerCase()

  const handleCreate = () => {
    setError(null)
    startTransition(async () => {
      const result = await createRecurringInvoice({
        source_invoice_id: invoiceId,
        frequency,
        start_date: startDate,
        end_date: endDate || undefined,
        max_runs: maxRuns ? Number(maxRuns) : undefined,
      })
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] max-w-md">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight">
            Make Recurring
          </DialogTitle>
          <DialogDescription className="text-[var(--text-muted)] text-[0.82rem]">
            Automatically create new DRAFT invoices based on {invoiceNumber}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Frequency</Label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
              <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {RECURRING_FREQUENCIES.map(f => (
                  <SelectItem key={f.value} value={f.value} className="text-[var(--text)]">
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">End Date (optional)</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Max Runs (optional)</Label>
            <Input
              type="number"
              min="1"
              value={maxRuns}
              onChange={(e) => setMaxRuns(e.target.value)}
              placeholder="Unlimited"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.88rem] focus-visible:ring-[var(--accent)]"
            />
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-[rgba(42,37,32,0.5)] bg-[rgba(11,11,11,0.5)] px-4 py-3">
            <p className="text-[0.82rem] text-[var(--text-muted)] font-light">
              Creates a new <span className="text-[var(--text)]">DRAFT</span> invoice {frequencyLabel} starting{" "}
              <span className="text-[var(--text)]">
                {new Date(startDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {maxRuns ? ` for ${maxRuns} runs` : ""}
              {endDate ? ` until ${new Date(endDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}
              .
            </p>
          </div>

          {error && (
            <p className="text-[0.82rem] text-red-400 font-light">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)] text-[0.82rem]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full px-5 text-[0.82rem]"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Repeat className="h-3.5 w-3.5 mr-1.5" />
              )}
              Create Schedule
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
