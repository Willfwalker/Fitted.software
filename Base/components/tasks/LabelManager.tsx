"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LabelBadge } from "./LabelBadge"
import { createLabel, deleteLabel } from "@/lib/actions/labels"
import type { Label } from "@/lib/types/tasks"

const PRESET_COLORS = [
  "#EF5B5B", "#E8A84C", "#5EC69A", "#5B8DEF",
  "#D4734E", "#8A817A", "#A478E8", "#E85BA0",
]

interface LabelManagerProps {
  labels: Label[]
}

export function LabelManager({ labels }: LabelManagerProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return

    const formData = new FormData()
    formData.set("name", name.trim())
    formData.set("color", color)

    await createLabel({}, formData)
    setName("")
    setIsCreating(false)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    await deleteLabel(id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[0.78rem] text-[var(--text-muted)] font-light">Labels</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="h-7 text-[0.75rem] text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      {isCreating && (
        <div className="flex items-center gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Label name"
            className="h-8 text-[0.82rem] bg-[var(--bg)] border-[var(--border)] text-[var(--text)] flex-1"
            onKeyDown={(e) => { if (e.key === "Enter") handleCreate() }}
          />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-5 h-5 rounded-full transition-all"
                style={{ backgroundColor: c, ...(color === c ? { boxShadow: `0 0 0 2px var(--bg-card), 0 0 0 4px ${c}` } : {}) }}
              />
            ))}
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="h-8 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-3 text-[0.75rem]"
          >
            Add
          </Button>
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {labels.map((label) => (
          <div key={label.id} className="group flex items-center gap-0.5">
            <LabelBadge label={label} />
            <button
              onClick={() => handleDelete(label.id)}
              className="hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full text-[var(--text-dim)] hover:text-red-400 transition-colors"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        {labels.length === 0 && !isCreating && (
          <p className="text-[0.78rem] text-[var(--text-dim)] font-light">No labels created yet.</p>
        )}
      </div>
    </div>
  )
}
