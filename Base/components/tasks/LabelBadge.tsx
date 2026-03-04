"use client"

import type { Label } from "@/lib/types/tasks"

interface LabelBadgeProps {
  label: Label
}

export function LabelBadge({ label }: LabelBadgeProps) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.68rem] font-medium"
      style={{
        color: label.color,
        backgroundColor: `${label.color}15`,
      }}
    >
      {label.name}
    </span>
  )
}
