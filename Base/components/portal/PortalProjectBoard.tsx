"use client"

import { Badge } from "@/components/ui/badge"

interface PortalTask {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  column: { id: string; name: string } | null
}

interface PortalProjectBoardProps {
  tasks: Record<string, unknown>[]
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "#EF5B5B",
  MEDIUM: "#E8A84C",
  LOW: "#8A817A",
  URGENT: "#EF5B5B",
}

export function PortalProjectBoard({ tasks }: PortalProjectBoardProps) {
  const items = tasks as unknown as PortalTask[]

  if (items.length === 0) {
    return (
      <p className="text-[0.85rem] text-[var(--text-dim)] italic">No tasks yet.</p>
    )
  }

  // Group by column
  const grouped = items.reduce<Record<string, PortalTask[]>>((acc, task) => {
    const colName = task.column?.name || "Uncategorized"
    if (!acc[colName]) acc[colName] = []
    acc[colName].push(task)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Object.entries(grouped).map(([colName, colTasks]) => (
        <div key={colName}>
          <h3 className="text-[0.75rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-3">
            {colName}
            <span className="ml-1.5 text-[var(--text-dim)]">({colTasks.length})</span>
          </h3>
          <div className="space-y-2">
            {colTasks.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border border-[var(--border)] p-3"
              >
                <p className="text-[0.85rem] text-[var(--text)] mb-1">{task.title}</p>
                <div className="flex items-center gap-2">
                  {task.priority && task.priority !== "NONE" && (
                    <Badge
                      variant="outline"
                      className="text-[0.65rem] px-1.5 py-0 border-0 font-medium"
                      style={{
                        color: PRIORITY_COLORS[task.priority] || "#8A817A",
                        backgroundColor: `${PRIORITY_COLORS[task.priority] || "#8A817A"}15`,
                      }}
                    >
                      {task.priority}
                    </Badge>
                  )}
                  {task.due_date && (
                    <span className="text-[0.7rem] text-[var(--text-dim)]">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
