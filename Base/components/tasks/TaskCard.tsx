"use client"

import { Badge } from "@/components/ui/badge"
import { Calendar, User } from "lucide-react"
import type { Task } from "@/lib/types/tasks"
import { TASK_PRIORITIES } from "@/lib/types/tasks"

interface TaskCardProps {
  task: Task
  onDragStart: () => void
  onClick: () => void
}

export function TaskCard({ task, onDragStart, onClick }: TaskCardProps) {
  const priority = TASK_PRIORITIES.find((p) => p.value === task.priority)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move"
        onDragStart()
      }}
      onClick={onClick}
      className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] cursor-grab active:cursor-grabbing hover:border-[rgba(212,115,78,0.2)] transition-colors"
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block h-1.5 w-6 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          ))}
        </div>
      )}

      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[0.85rem] text-[var(--text)] font-light leading-snug line-clamp-2">
          {task.title}
        </p>
        {priority && task.priority !== "NONE" && (
          <Badge
            variant="outline"
            className="shrink-0 text-[0.6rem] px-1.5 py-0 border-0 font-medium"
            style={{ color: priority.color, backgroundColor: `${priority.color}15` }}
          >
            {priority.label}
          </Badge>
        )}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        {task.due_date && (
          <span className={`flex items-center gap-1 text-[0.72rem] font-light ${
            isOverdue ? "text-red-400" : "text-[var(--text-dim)]"
          }`}>
            <Calendar className="h-3 w-3" />
            {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {task.assigned_to && (
          <span className="flex items-center gap-1 text-[0.72rem] text-[var(--text-dim)] font-light">
            <User className="h-3 w-3" />
          </span>
        )}
        {task.contact && (
          <span className="text-[0.72rem] text-[var(--text-dim)] font-light">
            {task.contact.first_name} {task.contact.last_name}
          </span>
        )}
      </div>
    </div>
  )
}
