"use client"

import { useActionState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createBoard, updateBoard, type BoardActionState } from "@/lib/actions/boards"
import type { Board } from "@/lib/types/tasks"

interface BoardFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board?: Board
}

export function BoardForm({ open, onOpenChange, board }: BoardFormProps) {
  const isEdit = !!board

  const action = isEdit
    ? updateBoard.bind(null, board.id)
    : createBoard

  const [state, formAction, isPending] = useActionState<BoardActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            {isEdit ? "Edit Board" : "New Board"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Board Name *</Label>
            <Input
              name="name"
              defaultValue={board?.name ?? ""}
              required
              placeholder="e.g. Website Redesign"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Description</Label>
            <Textarea
              name="description"
              defaultValue={board?.description ?? ""}
              rows={3}
              placeholder="What is this board for?"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
            />
          </div>

          {state.error && (
            <p className="text-[0.82rem] text-red-400">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
            >
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Board"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
