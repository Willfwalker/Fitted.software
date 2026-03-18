"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2, Calendar, User, Building2, Briefcase, Clock, Plus } from "lucide-react"
import { TaskForm } from "./TaskForm"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { LabelBadge } from "./LabelBadge"
import { TimerButton } from "@/components/time-tracking/TimerButton"
import { TimeEntryList } from "@/components/time-tracking/TimeEntryList"
import { TimeEntryForm } from "@/components/time-tracking/TimeEntryForm"
import { deleteTask } from "@/lib/actions/tasks"
import type { Task, BoardColumn, Label } from "@/lib/types/tasks"
import type { TimeEntry } from "@/lib/types/time-tracking"
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types/tasks"

interface TaskDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  boardId: string
  columns: BoardColumn[]
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  members: { id: string; email: string; name: string }[]
  labels: Label[]
  timeEntries?: TimeEntry[]
  runningTimer?: TimeEntry | null
}

export function TaskDetailSheet({
  open,
  onOpenChange,
  task,
  boardId,
  columns,
  contacts,
  companies,
  deals,
  members,
  labels,
  timeEntries = [],
  runningTimer = null,
}: TaskDetailSheetProps) {
  const router = useRouter()
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showLogTime, setShowLogTime] = useState(false)

  const priority = TASK_PRIORITIES.find((p) => p.value === task.priority)
  const status = TASK_STATUSES.find((s) => s.value === task.status)
  const column = columns.find((c) => c.id === task.column_id)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  const handleDelete = async () => {
    await deleteTask(task.id, boardId)
    setShowDelete(false)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="bg-[var(--bg-card)] border-l-[var(--border)] text-[var(--text)] !w-[480px] !max-w-[480px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <div className="flex items-start justify-between">
              <SheetTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] tracking-tight leading-tight pr-4">
                {task.title}
              </SheetTitle>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEdit(true)}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDelete(true)}
                  className="h-8 w-8 text-[var(--text-dim)] hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div className="space-y-5 px-4 pb-6">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {status && (
                <Badge
                  variant="outline"
                  className="text-[0.72rem] px-2.5 py-0.5 border-0 font-medium"
                  style={{ color: status.color, backgroundColor: `${status.color}15` }}
                >
                  {status.label}
                </Badge>
              )}
              {priority && task.priority !== "NONE" && (
                <Badge
                  variant="outline"
                  className="text-[0.72rem] px-2.5 py-0.5 border-0 font-medium"
                  style={{ color: priority.color, backgroundColor: `${priority.color}15` }}
                >
                  {priority.label}
                </Badge>
              )}
              {column && (
                <Badge
                  variant="outline"
                  className="text-[0.72rem] px-2.5 py-0.5 border-[var(--border)] text-[var(--text-muted)]"
                >
                  {column.name}
                </Badge>
              )}
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {task.labels.map((label) => (
                  <LabelBadge key={label.id} label={label} />
                ))}
              </div>
            )}

            {/* Description */}
            {task.description && (
              <div>
                <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-2">
                  Description
                </p>
                <p className="text-[0.85rem] text-[var(--text-muted)] font-light whitespace-pre-wrap">
                  {task.description}
                </p>
              </div>
            )}

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              {task.due_date && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Due Date
                    </p>
                  </div>
                  <p className={`text-[0.88rem] font-light ${isOverdue ? "text-red-400" : "text-[var(--text)]"}`}>
                    {new Date(task.due_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {task.contact && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Contact
                    </p>
                  </div>
                  <p className="text-[0.88rem] text-[var(--text)] font-light">
                    {task.contact.first_name} {task.contact.last_name}
                  </p>
                </div>
              )}

              {task.company && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Company
                    </p>
                  </div>
                  <p className="text-[0.88rem] text-[var(--text)] font-light">
                    {task.company.name}
                  </p>
                </div>
              )}

              {task.deal && (
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                    <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                      Deal
                    </p>
                  </div>
                  <p className="text-[0.88rem] text-[var(--text)] font-light">
                    {task.deal.title}
                  </p>
                </div>
              )}
            </div>

            {/* Time Tracking */}
            <div className="pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[var(--text-dim)]" strokeWidth={1.8} />
                  <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
                    Time Tracking
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TimerButton taskId={task.id} runningEntry={runningTimer} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLogTime(true)}
                    className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {timeEntries.length > 0 && (
                <TimeEntryList entries={timeEntries} compact />
              )}
              {timeEntries.length > 0 && (
                <p className="text-[0.72rem] text-[var(--text-dim)] mt-2">
                  Total: {(timeEntries.reduce((sum, e) => sum + e.duration_minutes, 0) / 60).toFixed(1)}h
                </p>
              )}
            </div>

            {/* Timestamps */}
            <div className="pt-3 border-t border-[var(--border)]">
              <p className="text-[0.72rem] text-[var(--text-dim)] font-light">
                Created {new Date(task.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <TaskForm
        open={showEdit}
        onOpenChange={setShowEdit}
        boardId={boardId}
        columnId={task.column_id}
        columns={columns}
        contacts={contacts}
        companies={companies}
        deals={deals}
        members={members}
        labels={labels}
        task={task}
      />

      {/* Log Time */}
      <TimeEntryForm
        open={showLogTime}
        onOpenChange={setShowLogTime}
        taskId={task.id}
        dealId={task.deal_id || undefined}
        contactId={task.contact_id || undefined}
        companyId={task.company_id || undefined}
      />

      {/* Delete Confirm */}
      <DeleteConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
      />
    </>
  )
}
