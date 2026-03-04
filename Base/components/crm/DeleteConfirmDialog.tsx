"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.2rem] text-[var(--text)]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[0.88rem] text-[var(--text-muted)] font-light">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-500/90 hover:bg-red-500 text-white rounded-full px-6"
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
