"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./TaskCard"
import type { BoardColumn, Task } from "@/lib/types/tasks"

interface KanbanColumnProps {
  column: BoardColumn
  tasks: Task[]
  onDragStart: (taskId: string) => void
  onDrop: () => void
  onTaskClick: (task: Task) => void
  onAddTask: () => void
}

export function KanbanColumn({
  column,
  tasks,
  onDragStart,
  onDrop,
  onTaskClick,
  onAddTask,
}: KanbanColumnProps) {
  const [isOver, setIsOver] = useState(false)

  const isAtLimit = column.wip_limit != null && tasks.length >= column.wip_limit

  return (
    <div
      className={`rounded-xl border bg-[var(--bg-card)] flex flex-col transition-colors ${
        isOver ? "border-[var(--accent)]" : "border-[var(--border)]"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsOver(false)
        onDrop()
      }}
    >
      {/* Column header */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: column.color || "#8A817A" }}
            />
            <span className="text-[0.82rem] font-light text-[var(--text)]">
              {column.name}
            </span>
            <span className="text-[0.72rem] text-[var(--text-dim)] font-light">
              {tasks.length}
              {column.wip_limit != null && `/${column.wip_limit}`}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddTask}
            className="h-6 w-6 text-[var(--text-dim)] hover:text-[var(--text)]"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {isAtLimit && (
          <p className="text-[0.68rem] text-[var(--accent)] font-light mt-1">
            WIP limit reached
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 min-h-[200px] flex-1">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={() => onDragStart(task.id)}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </div>
  )
}
