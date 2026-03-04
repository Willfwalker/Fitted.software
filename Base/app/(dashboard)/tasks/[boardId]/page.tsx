import { getServerContext } from "@/lib/supabase/context"
import { KanbanBoard } from "@/components/tasks/KanbanBoard"
import type { BoardColumn, Task, Label } from "@/lib/types/tasks"

export default async function BoardPage({
  params,
}: {
  params: Promise<{ boardId: string }>
}) {
  const { boardId } = await params
  const ctx = await getServerContext()
  if (!ctx) return null

  const { supabase, orgId } = ctx

  // Fetch board, columns, tasks, labels, and CRM data in parallel
  const [
    { data: board },
    { data: columns },
    { data: tasks },
    { data: labels },
    { data: contacts },
    { data: companies },
    { data: deals },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("boards")
      .select("*")
      .eq("id", boardId)
      .eq("org_id", orgId)
      .single(),
    supabase
      .from("board_columns")
      .select("*")
      .eq("board_id", boardId)
      .order("position", { ascending: true }),
    supabase
      .from("tasks")
      .select("*, task_labels(label_id, labels:labels(*))")
      .eq("board_id", boardId)
      .eq("org_id", orgId)
      .order("position", { ascending: true }),
    supabase
      .from("labels")
      .select("*")
      .eq("org_id", orgId)
      .order("name"),
    supabase
      .from("contacts")
      .select("id, first_name, last_name")
      .eq("org_id", orgId)
      .order("first_name"),
    supabase
      .from("companies")
      .select("id, name")
      .eq("org_id", orgId)
      .order("name"),
    supabase
      .from("deals")
      .select("id, title")
      .eq("org_id", orgId)
      .order("title"),
    supabase
      .from("organization_members")
      .select("user_id, users:user_id(id, email, raw_user_meta_data)")
      .eq("org_id", orgId),
  ])

  if (!board) return null

  // Flatten task labels
  const tasksWithLabels = (tasks ?? []).map((t) => ({
    ...t,
    labels: (t.task_labels as unknown as { label_id: string; labels: Label }[])?.map((tl) => tl.labels).filter(Boolean) ?? [],
  })) as Task[]

  // Build members list for assignment
  const membersList = (members ?? []).map((m) => {
    const user = m.users as unknown as { id: string; email: string; raw_user_meta_data: Record<string, unknown> } | null
    return {
      id: user?.id ?? m.user_id,
      email: user?.email ?? "",
      name: (user?.raw_user_meta_data?.full_name as string) ?? user?.email ?? "",
    }
  })

  return (
    <div className="p-8 lg:p-12 max-w-[1600px]">
      <KanbanBoard
        board={board}
        columns={(columns ?? []) as BoardColumn[]}
        tasks={tasksWithLabels}
        labels={(labels ?? []) as Label[]}
        contacts={contacts ?? []}
        companies={companies ?? []}
        deals={deals ?? []}
        members={membersList}
      />
    </div>
  )
}
