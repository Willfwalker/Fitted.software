"use client"

import { Badge } from "@/components/ui/badge"
import type { Deal } from "@/lib/types/crm"
import { PRIORITY_CONFIG } from "@/lib/types/crm"

interface DealCardProps {
  deal: Deal
  onDragStart: () => void
  onClick: () => void
}

export function DealCard({ deal, onDragStart, onClick }: DealCardProps) {
  const priority = PRIORITY_CONFIG[deal.priority]

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onClick={onClick}
      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] cursor-grab active:cursor-grabbing hover:border-[rgba(212,115,78,0.2)] transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[0.85rem] text-[var(--text)] font-light leading-snug line-clamp-2">
          {deal.title}
        </p>
        <Badge
          variant="outline"
          className="shrink-0 text-[0.6rem] px-1.5 py-0 border-0 font-medium"
          style={{ color: priority.color, backgroundColor: `${priority.color}15` }}
        >
          {priority.label}
        </Badge>
      </div>

      {deal.value && (
        <p className="text-[0.88rem] text-[var(--text)] font-light mb-1.5">
          ${Number(deal.value).toLocaleString()}
        </p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {deal.contact && (
          <span className="text-[0.72rem] text-[var(--text-dim)] font-light">
            {deal.contact.first_name} {deal.contact.last_name}
          </span>
        )}
        {deal.contact && deal.company && (
          <span className="text-[var(--text-dim)]">&middot;</span>
        )}
        {deal.company && (
          <span className="text-[0.72rem] text-[var(--text-dim)] font-light">
            {deal.company.name}
          </span>
        )}
      </div>
    </div>
  )
}
