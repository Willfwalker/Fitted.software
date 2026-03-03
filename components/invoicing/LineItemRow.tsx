"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface LineItemRowProps {
  index: number
  item: { description: string; quantity: number; rate: number; amount: number }
  onChange: (index: number, field: string, value: string | number) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

export function LineItemRow({ index, item, onChange, onRemove, canRemove }: LineItemRowProps) {
  return (
    <div className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-center">
      <Input
        placeholder="Description"
        value={item.description}
        onChange={(e) => onChange(index, "description", e.target.value)}
        className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.85rem]"
      />
      <Input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="Qty"
        value={item.quantity || ""}
        onChange={(e) => onChange(index, "quantity", parseFloat(e.target.value) || 0)}
        className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.85rem]"
      />
      <Input
        type="number"
        min="0"
        step="0.01"
        placeholder="Rate"
        value={item.rate || ""}
        onChange={(e) => onChange(index, "rate", parseFloat(e.target.value) || 0)}
        className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] text-[0.85rem]"
      />
      <div className="text-[0.85rem] text-[var(--text)] font-light text-right pr-1">
        ${item.amount.toFixed(2)}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="h-8 w-8 text-[var(--text-dim)] hover:text-red-400 disabled:opacity-30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
