"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Pencil, Trash2 } from "lucide-react"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { TimeEntryForm } from "./TimeEntryForm"
import { deleteTimeEntry } from "@/lib/actions/time-entries"
import type { TimeEntry } from "@/lib/types/time-tracking"
import type { OrgMember } from "@/lib/types/members"

interface TimeEntryListProps {
  entries: TimeEntry[]
  showTask?: boolean
  compact?: boolean
  showUser?: boolean
  readOnly?: boolean
  members?: OrgMember[]
}

export function TimeEntryList({ entries, showTask = false, compact = false, showUser = false, readOnly = false, members = [] }: TimeEntryListProps) {
  const router = useRouter()
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    await deleteTimeEntry(deleteId)
    setDeleteId(null)
    router.refresh()
  }

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const getMemberName = (userId: string) => {
    const member = members.find((m) => m.user_id === userId)
    return member?.full_name || member?.email || "Unknown"
  }

  if (entries.length === 0) {
    return (
      <p className="text-[0.8rem] text-[var(--text-dim)] italic">
        No time entries yet.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start justify-between gap-2 rounded-lg border border-[var(--border)] p-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Clock className="h-3.5 w-3.5 text-[var(--text-dim)] shrink-0" />
                <span className="text-[0.85rem] font-medium text-[var(--text)]">
                  {formatDuration(entry.duration_minutes)}
                </span>
                {showUser && (
                  <span className="text-[0.75rem] text-[var(--accent)] font-medium">
                    {getMemberName(entry.user_id)}
                  </span>
                )}
                {entry.billable && (
                  <Badge
                    variant="outline"
                    className="text-[0.65rem] px-1.5 py-0 border-0 font-medium"
                    style={{ color: "#5EC69A", backgroundColor: "#5EC69A15" }}
                  >
                    Billable
                  </Badge>
                )}
                {entry.invoice_id && (
                  <Badge
                    variant="outline"
                    className="text-[0.65rem] px-1.5 py-0 border-0 font-medium"
                    style={{ color: "#5B8DEF", backgroundColor: "#5B8DEF15" }}
                  >
                    Invoiced
                  </Badge>
                )}
              </div>
              {entry.description && (
                <p className="text-[0.78rem] text-[var(--text-muted)] truncate">
                  {entry.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {showTask && entry.task && (
                  <span className="text-[0.72rem] text-[var(--text-dim)]">
                    {entry.task.title}
                  </span>
                )}
                {!compact && (
                  <span className="text-[0.72rem] text-[var(--text-dim)]">
                    {new Date(entry.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                {entry.rate > 0 && (
                  <span className="text-[0.72rem] text-[var(--text-dim)]">
                    ${((entry.duration_minutes / 60) * entry.rate).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {!readOnly && !entry.invoice_id && (
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditEntry(entry)}
                  className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteId(entry.id)}
                  className="h-7 w-7 text-[var(--text-dim)] hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {editEntry && (
        <TimeEntryForm
          open={!!editEntry}
          onOpenChange={(open) => !open && setEditEntry(null)}
          entry={editEntry}
          taskId={editEntry.task_id || undefined}
        />
      )}

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Time Entry"
        description="Are you sure you want to delete this time entry? This action cannot be undone."
      />
    </>
  )
}
