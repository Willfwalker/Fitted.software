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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createTask, updateTask, type TaskActionState } from "@/lib/actions/tasks"
import type { Task, BoardColumn, Label as TaskLabel } from "@/lib/types/tasks"
import { TASK_PRIORITIES } from "@/lib/types/tasks"

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  columnId: string
  columns: BoardColumn[]
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  members: { id: string; email: string; name: string }[]
  labels: TaskLabel[]
  task?: Task
}

export function TaskForm({
  open,
  onOpenChange,
  boardId,
  columnId,
  columns,
  contacts,
  companies,
  deals,
  members,
  task,
}: TaskFormProps) {
  const isEdit = !!task

  const action = isEdit
    ? updateTask.bind(null, task.id, boardId)
    : createTask

  const [state, formAction, isPending] = useActionState<TaskActionState, FormData>(action, {})

  useEffect(() => {
    if (state.success) {
      onOpenChange(false)
    }
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            {isEdit ? "Edit Task" : "Add Task"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 mt-2">
          <input type="hidden" name="board_id" value={boardId} />
          <input type="hidden" name="column_id" value={task?.column_id ?? columnId} />

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Title *</Label>
            <Input
              name="title"
              defaultValue={task?.title ?? ""}
              required
              placeholder="What needs to be done?"
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[0.78rem] text-[var(--text-muted)]">Description</Label>
            <Textarea
              name="description"
              defaultValue={task?.description ?? ""}
              rows={3}
              placeholder="Add more details..."
              className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Column</Label>
              <Select name="column_id" defaultValue={task?.column_id ?? columnId}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {columns.map((col) => (
                    <SelectItem key={col.id} value={col.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color || "#8A817A" }} />
                        {col.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Priority</Label>
              <Select name="priority" defaultValue={task?.priority ?? "NONE"}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                        {p.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Due Date</Label>
              <Input
                name="due_date"
                type="date"
                defaultValue={task?.due_date ?? ""}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Assigned To</Label>
              <Select name="assigned_to" defaultValue={task?.assigned_to ?? ""}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      {m.name || m.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Contact</Label>
              <Select name="contact_id" defaultValue={task?.contact_id ?? ""}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      {c.first_name} {c.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Company</Label>
              <Select name="company_id" defaultValue={task?.company_id ?? ""}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">Deal</Label>
              <Select name="deal_id" defaultValue={task?.deal_id ?? ""}>
                <SelectTrigger className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                  {deals.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]">
                      {d.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
