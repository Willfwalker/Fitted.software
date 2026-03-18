"use client"

import { ClipboardList } from "lucide-react"

interface PortalSubmission {
  id: string
  data: Record<string, unknown>
  submitted_at: string
  form: { id: string; name: string } | null
}

interface PortalFormListProps {
  submissions: Record<string, unknown>[]
}

export function PortalFormList({ submissions }: PortalFormListProps) {
  const items = submissions as unknown as PortalSubmission[]

  if (items.length === 0) {
    return (
      <p className="text-[0.85rem] text-[var(--text-dim)] italic">No form submissions yet.</p>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((sub) => (
        <div
          key={sub.id}
          className="rounded-xl border border-[var(--border)] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="h-3.5 w-3.5 text-[var(--text-dim)]" />
            <span className="text-[0.85rem] font-medium text-[var(--text)]">
              {sub.form?.name || "Form Submission"}
            </span>
            <span className="text-[0.72rem] text-[var(--text-dim)] ml-auto">
              {new Date(sub.submitted_at).toLocaleDateString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(sub.data || {}).slice(0, 6).map(([key, value]) => (
              <div key={key}>
                <p className="text-[0.7rem] text-[var(--text-dim)]">{key}</p>
                <p className="text-[0.8rem] text-[var(--text-muted)] truncate">
                  {String(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
