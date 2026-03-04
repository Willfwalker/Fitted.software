import { getServerContext } from "@/lib/supabase/context"
import { BoardList } from "@/components/tasks/BoardList"
import type { Board } from "@/lib/types/tasks"

export default async function TasksPage() {
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  const { data: boards } = await supabase
    .from("boards")
    .select("*, tasks(count)")
    .eq("org_id", orgId)
    .eq("archived", false)
    .order("created_at", { ascending: false })

  const boardsWithCount = (boards ?? []).map((b) => ({
    ...b,
    task_count: (b.tasks as unknown as { count: number }[])?.[0]?.count ?? 0,
  })) as (Board & { task_count: number })[]

  return (
    <div className="p-8 lg:p-12 max-w-[1400px] space-y-6">
      <div className="animate-dash-in" style={{ animationDelay: "0ms" }}>
        <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
          Projects
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] tracking-tight leading-tight">
          Boards
        </h1>
      </div>
      <div className="animate-dash-in" style={{ animationDelay: "60ms" }}>
        <BoardList boards={boardsWithCount} />
      </div>
    </div>
  )
}
