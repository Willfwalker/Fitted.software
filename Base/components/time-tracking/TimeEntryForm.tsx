"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { createTimeEntry, updateTimeEntry } from "@/lib/actions/time-entries"
import type { TimeEntry } from "@/lib/types/time-tracking"

interface TimeEntryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId?: string
  dealId?: string
  contactId?: string
  companyId?: string
  entry?: TimeEntry
}

export function TimeEntryForm({
  open,
  onOpenChange,
  taskId,
  dealId,
  contactId,
  companyId,
  entry,
}: TimeEntryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = !!entry

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const hours = parseFloat(form.get("hours") as string) || 0
    const minutes = parseFloat(form.get("minutes") as string) || 0
    const totalMinutes = Math.round(hours * 60 + minutes)

    const data = {
      task_id: taskId || (form.get("task_id") as string) || undefined,
      deal_id: dealId || (form.get("deal_id") as string) || undefined,
      contact_id: contactId || (form.get("contact_id") as string) || undefined,
      company_id: companyId || (form.get("company_id") as string) || undefined,
      description: (form.get("description") as string) || undefined,
      duration_minutes: totalMinutes,
      date: (form.get("date") as string) || new Date().toISOString().split("T")[0],
      billable: form.get("billable") === "on",
      rate: parseFloat(form.get("rate") as string) || 0,
    }

    const result = isEdit
      ? await updateTimeEntry(entry.id, data)
      : await createTimeEntry(data)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onOpenChange(false)
      router.refresh()
    }
  }

  const defaultHours = entry ? Math.floor(entry.duration_minutes / 60) : 0
  const defaultMinutes = entry ? entry.duration_minutes % 60 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[var(--text)]">
            {isEdit ? "Edit Time Entry" : "Log Time"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[var(--text-muted)] text-xs">Hours</Label>
              <Input
                name="hours"
                type="number"
                min="0"
                step="1"
                defaultValue={defaultHours}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div>
              <Label className="text-[var(--text-muted)] text-xs">Minutes</Label>
              <Input
                name="minutes"
                type="number"
                min="0"
                max="59"
                step="1"
                defaultValue={defaultMinutes}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
          </div>

          <div>
            <Label className="text-[var(--text-muted)] text-xs">Date</Label>
            <Input
              name="date"
              type="date"
              defaultValue={entry?.date || new Date().toISOString().split("T")[0]}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div>
            <Label className="text-[var(--text-muted)] text-xs">Description</Label>
            <Textarea
              name="description"
              defaultValue={entry?.description || ""}
              rows={2}
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[var(--text-muted)] text-xs">Rate ($/hr)</Label>
              <Input
                name="rate"
                type="number"
                min="0"
                step="0.01"
                defaultValue={entry?.rate || 0}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="flex items-end gap-2 pb-1">
              <Switch
                name="billable"
                defaultChecked={entry?.billable ?? true}
              />
              <Label className="text-[var(--text-muted)] text-xs">Billable</Label>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[var(--text-muted)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[var(--accent)] text-white hover:opacity-90"
            >
              {loading ? "Saving..." : isEdit ? "Update" : "Log Time"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
