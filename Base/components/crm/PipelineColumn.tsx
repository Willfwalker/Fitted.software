"use client"

import { useState } from "react"
import { DealCard } from "./DealCard"
import type { Deal, DealStage } from "@/lib/types/crm"

interface PipelineColumnProps {
  stage: DealStage
  label: string
  color: string
  deals: Deal[]
  isDragOver: boolean
  onDragStart: (dealId: string) => void
  onDrop: () => void
  onDealClick: (deal: Deal) => void
}

export function PipelineColumn({
  label,
  color,
  deals,
  onDragStart,
  onDrop,
  onDealClick,
}: PipelineColumnProps) {
  const [isOver, setIsOver] = useState(false)

  const total = deals.reduce((sum, d) => sum + (Number(d.value) || 0), 0)

  return (
    <div
      className={`rounded-xl border bg-[var(--bg-card)] flex flex-col transition-colors ${
        isOver ? "border-[var(--accent)]" : "border-[var(--border)]"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        onDrop()
      }}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[0.82rem] font-light text-[var(--text)]">{label}</span>
            <span className="text-[0.72rem] text-[var(--text-dim)] font-light">
              {deals.length}
            </span>
          </div>
          {total > 0 && (
            <span className="text-[0.75rem] text-[var(--text-dim)] font-light">
              ${total.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 min-h-[120px] flex-1">
        {deals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onDragStart={() => onDragStart(deal.id)}
            onClick={() => onDealClick(deal)}
          />
        ))}
      </div>
    </div>
  )
}
