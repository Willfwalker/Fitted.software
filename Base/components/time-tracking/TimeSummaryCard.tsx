"use client"

import { Clock, DollarSign } from "lucide-react"
import type { TimeSummary } from "@/lib/types/time-tracking"

interface TimeSummaryCardProps {
  summary: TimeSummary
}

export function TimeSummaryCard({ summary }: TimeSummaryCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <Clock className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            Total Hours
          </p>
        </div>
        <p className="text-[1.2rem] font-light text-[var(--text)]">
          {summary.total_hours}h
        </p>
        <p className="text-[0.72rem] text-[var(--text-dim)]">
          {summary.entry_count} {summary.entry_count === 1 ? "entry" : "entries"}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4">
        <div className="flex items-center gap-2 mb-1.5">
          <DollarSign className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            Billable
          </p>
        </div>
        <p className="text-[1.2rem] font-light text-[var(--text)]">
          ${summary.billable_amount.toLocaleString()}
        </p>
        <p className="text-[0.72rem] text-[var(--text-dim)]">
          {summary.billable_hours}h billable
        </p>
      </div>
    </div>
  )
}
