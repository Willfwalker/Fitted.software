"use client"

import type { TimeEntry } from "@/lib/types/time-tracking"
import type { OrgMember } from "@/lib/types/members"

interface TeamMemberSummaryProps {
  entries: TimeEntry[]
  members: OrgMember[]
}

export function TeamMemberSummary({ entries, members }: TeamMemberSummaryProps) {
  // Group entries by user_id
  const byUser = new Map<string, { minutes: number; billableMinutes: number; amount: number }>()

  for (const entry of entries) {
    const existing = byUser.get(entry.user_id) ?? { minutes: 0, billableMinutes: 0, amount: 0 }
    existing.minutes += entry.duration_minutes
    if (entry.billable) {
      existing.billableMinutes += entry.duration_minutes
      existing.amount += (entry.duration_minutes / 60) * (entry.rate || 0)
    }
    byUser.set(entry.user_id, existing)
  }

  if (byUser.size === 0) return null

  const rows = Array.from(byUser.entries())
    .map(([userId, stats]) => {
      const member = members.find((m) => m.user_id === userId)
      return {
        name: member?.full_name || member?.email || "Unknown",
        hours: Number((stats.minutes / 60).toFixed(1)),
        billableHours: Number((stats.billableMinutes / 60).toFixed(1)),
        amount: Number(stats.amount.toFixed(2)),
      }
    })
    .sort((a, b) => b.hours - a.hours)

  return (
    <div className="rounded-lg border border-[var(--border)] overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[rgba(232,224,212,0.02)]">
            <th className="px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)]">
              Member
            </th>
            <th className="px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)] text-right">
              Total Hours
            </th>
            <th className="px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)] text-right">
              Billable Hours
            </th>
            <th className="px-4 py-2.5 text-[0.72rem] font-medium uppercase tracking-wider text-[var(--text-dim)] text-right">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-[var(--border)] last:border-b-0">
              <td className="px-4 py-2.5 text-[0.84rem] text-[var(--text)] font-medium">
                {row.name}
              </td>
              <td className="px-4 py-2.5 text-[0.84rem] text-[var(--text-muted)] text-right">
                {row.hours}h
              </td>
              <td className="px-4 py-2.5 text-[0.84rem] text-right" style={{ color: "#5EC69A" }}>
                {row.billableHours}h
              </td>
              <td className="px-4 py-2.5 text-[0.84rem] text-[var(--text-muted)] text-right">
                ${row.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
