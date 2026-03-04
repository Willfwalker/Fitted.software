"use client"

import { useState, useTransition } from "react"
import { Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TagBadge } from "./TagBadge"
import { addTagToEntity, removeTagFromEntity } from "@/lib/actions/tags"
import type { Tag } from "@/lib/types/crm"

interface TagSelectorProps {
  entityType: "contact" | "company" | "deal"
  entityId: string
  allTags: Tag[]
  selectedTagIds: string[]
  onUpdate?: () => void
}

export function TagSelector({ entityType, entityId, allTags, selectedTagIds, onUpdate }: TagSelectorProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedTagIds))
  const [isPending, startTransition] = useTransition()

  const toggleTag = (tag: Tag) => {
    const isSelected = selected.has(tag.id)
    const next = new Set(selected)

    startTransition(async () => {
      if (isSelected) {
        await removeTagFromEntity(tag.id, entityType, entityId)
        next.delete(tag.id)
      } else {
        await addTagToEntity(tag.id, entityType, entityId)
        next.add(tag.id)
      }
      setSelected(next)
      onUpdate?.()
    })
  }

  const selectedTags = allTags.filter((t) => selected.has(t.id))

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {selectedTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          onRemove={() => toggleTag(tag)}
        />
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            className="h-6 w-6 text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-[var(--bg-card)] border-[var(--border)] w-[180px]">
          {allTags.length === 0 ? (
            <p className="px-3 py-2 text-[0.78rem] text-[var(--text-dim)]">No tags yet</p>
          ) : (
            allTags.map((tag) => (
              <DropdownMenuItem
                key={tag.id}
                onClick={(e) => { e.preventDefault(); toggleTag(tag) }}
                className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)] cursor-pointer"
              >
                <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="flex-1 text-[0.82rem]">{tag.name}</span>
                {selected.has(tag.id) && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
