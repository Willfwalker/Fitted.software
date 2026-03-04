"use client"

import { useState, useActionState, useEffect } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TagBadge } from "./TagBadge"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { createTag, updateTag, deleteTag, type TagActionState } from "@/lib/actions/tags"
import type { Tag } from "@/lib/types/crm"

const PRESET_COLORS = [
  "#D4734E", "#5B8DEF", "#5EC69A", "#E8A84C", "#EF5B5B",
  "#8A817A", "#B07CD8", "#4ECDC4",
]

interface TagManagerProps {
  tags: Tag[]
}

export function TagManager({ tags }: TagManagerProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null)
  const [name, setName] = useState("")
  const [color, setColor] = useState(PRESET_COLORS[0])

  const isEdit = !!editId
  const action = isEdit ? updateTag.bind(null, editId) : createTag
  const [state, formAction, isPending] = useActionState<TagActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      setShowCreate(false)
      setEditId(null)
      setName("")
      setColor(PRESET_COLORS[0])
    }
  }, [state.success])

  const handleEdit = (tag: Tag) => {
    setEditId(tag.id)
    setName(tag.name)
    setColor(tag.color)
    setShowCreate(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteTag(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[0.82rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
          Tags
        </h3>
        {!showCreate && (
          <Button
            variant="ghost"
            onClick={() => { setShowCreate(true); setEditId(null); setName(""); setColor(PRESET_COLORS[0]) }}
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-[0.82rem]"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Tag
          </Button>
        )}
      </div>

      {/* Create/Edit form */}
      {showCreate && (
        <form action={formAction} className="flex items-center gap-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)]">
          <Input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="flex-1 bg-transparent border-0 text-[var(--text)] text-[0.85rem] h-8 p-0 focus-visible:ring-0"
          />
          <input type="hidden" name="color" value={color} />
          <div className="flex items-center gap-1">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full transition-all ${color === c ? "ring-2 ring-offset-1 ring-offset-[var(--bg)]" : ""}`}
                style={{ backgroundColor: c, outlineColor: color === c ? c : undefined }}
              />
            ))}
          </div>
          <Button
            type="submit"
            disabled={isPending || !name.trim()}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-4 h-8 text-[0.78rem]"
          >
            {isPending ? "..." : isEdit ? "Save" : "Add"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setShowCreate(false); setEditId(null) }}
            className="h-8 text-[var(--text-dim)] text-[0.78rem]"
          >
            Cancel
          </Button>
        </form>
      )}

      {state.error && <p className="text-[0.82rem] text-red-400">{state.error}</p>}

      {/* Tag list */}
      {tags.length === 0 && !showCreate ? (
        <p className="text-[0.85rem] text-[var(--text-dim)] font-light">No tags created yet.</p>
      ) : (
        <div className="space-y-1">
          {tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between py-2 px-1 group">
              <TagBadge name={tag.name} color={tag.color} />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(tag)}
                  className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget(tag)}
                  className="h-7 w-7 text-[var(--text-dim)] hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        onConfirm={handleDelete}
        title="Delete Tag"
        description={`Are you sure you want to delete the tag "${deleteTarget?.name}"? It will be removed from all entities.`}
      />
    </div>
  )
}
