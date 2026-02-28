"use client"

import { Users, Building2, Briefcase, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

const icons = {
  Users,
  Building2,
  Briefcase,
  FileText,
}

interface EmptyStateProps {
  icon: keyof typeof icons
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  const Icon = icons[icon]

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-5">
        <Icon className="h-6 w-6 text-[var(--text-dim)]" />
      </div>
      <h3 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-2">
        {title}
      </h3>
      <p className="text-[0.88rem] text-[var(--text-muted)] font-light text-center max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
