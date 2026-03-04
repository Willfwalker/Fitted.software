"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { KanbanColumn } from "./KanbanColumn"
import { TaskForm } from "./TaskForm"
import { TaskDetailSheet } from "./TaskDetailSheet"
import { moveTask } from "@/lib/actions/tasks"
import type { Board, BoardColumn, Task, Label } from "@/lib/types/tasks"

interface KanbanBoardProps {
  board: Board
  columns: BoardColumn[]
  tasks: Task[]
  labels: Label[]
  contacts: { id: string; first_name: string; last_name: string }[]
  companies: { id: string; name: string }[]
  deals: { id: string; title: string }[]
  members: { id: string; email: string; name: string }[]
}

export function KanbanBoard({
  board,
  columns,
  tasks: initialTasks,
  labels,
  contacts,
  companies,
  deals,
  members,
}: KanbanBoardProps) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [showCreate, setShowCreate] = useState(false)
  const [createColumnId, setCreateColumnId] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Group tasks by column
  const tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.column_id === col.id)
    return acc
  }, {} as Record<string, Task[]>)

  const handleDragStart = useCallback((taskId: string) => {
    setDraggedTaskId(taskId)
  }, [])

  const handleDrop = useCallback(
    async (targetColumnId: string) => {
      if (!draggedTaskId) return

      const task = tasks.find((t) => t.id === draggedTaskId)
      if (!task || task.column_id === targetColumnId) {
        setDraggedTaskId(null)
        return
      }

      // Optimistic update
      const newPosition = tasksByColumn[targetColumnId]?.length ?? 0
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggedTaskId
            ? { ...t, column_id: targetColumnId, position: newPosition }
            : t
        )
      )
      setDraggedTaskId(null)

      // Server update
      const result = await moveTask(draggedTaskId, targetColumnId, newPosition, board.id)
      if (result.error) {
        setTasks(initialTasks)
      } else {
        router.refresh()
      }
    },
    [draggedTaskId, tasks, tasksByColumn, initialTasks, router, board.id]
  )

  const handleCreateInColumn = (columnId: string) => {
    setCreateColumnId(columnId)
    setShowCreate(true)
  }

  const defaultColumnId = columns[0]?.id ?? ""

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/tasks"
            className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--text-muted)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[1.4rem] text-[var(--text)] tracking-tight">
              {board.name}
            </h1>
            {board.description && (
              <p className="text-[0.78rem] text-[var(--text-dim)] font-light mt-0.5">
                {board.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-[0.82rem] text-[var(--text-dim)] font-light">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""}
          </p>
          <Button
            onClick={() => { setCreateColumnId(defaultColumnId); setShowCreate(true) }}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Columns */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] ?? []}
            onDragStart={handleDragStart}
            onDrop={() => handleDrop(column.id)}
            onTaskClick={setSelectedTask}
            onAddTask={() => handleCreateInColumn(column.id)}
          />
        ))}
      </div>

      {/* Create Task Dialog */}
      <TaskForm
        open={showCreate}
        onOpenChange={setShowCreate}
        boardId={board.id}
        columnId={createColumnId ?? defaultColumnId}
        columns={columns}
        contacts={contacts}
        companies={companies}
        deals={deals}
        members={members}
        labels={labels}
      />

      {/* Task Detail Sheet */}
      {selectedTask && (
        <TaskDetailSheet
          open={!!selectedTask}
          onOpenChange={(open) => { if (!open) setSelectedTask(null) }}
          task={selectedTask}
          boardId={board.id}
          columns={columns}
          contacts={contacts}
          companies={companies}
          deals={deals}
          members={members}
          labels={labels}
        />
      )}
    </>
  )
}
