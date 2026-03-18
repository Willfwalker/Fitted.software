"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { taskSchema } from "@/lib/validations/tasks"
import { notifyOrgMembers, createNotification } from "./notifications"
import { runAutomations } from "@/lib/automations/engine"

export type TaskActionState = {
  error?: string
  success?: boolean
}

export async function createTask(
  _prev: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = taskSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  // Get next position in the column
  const { count } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("column_id", data.column_id)

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      org_id: ctx.orgId,
      board_id: data.board_id,
      column_id: data.column_id,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date || null,
      assigned_to: data.assigned_to || null,
      contact_id: data.contact_id || null,
      company_id: data.company_id || null,
      deal_id: data.deal_id || null,
      position: count ?? 0,
      metadata: data.metadata ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    contact_id: data.contact_id || null,
    company_id: data.company_id || null,
    deal_id: data.deal_id || null,
    type: "TASK_CREATED",
    title: `Created task "${data.title}"`,
    metadata: { task_id: task.id, board_id: data.board_id },
    created_by: ctx.userId,
  })

  await notifyOrgMembers({
    orgId: ctx.orgId,
    performerUserId: ctx.userId,
    category: "task",
    title: `New task: "${data.title}"`,
    link: `/tasks/${data.board_id}`,
    icon: "CheckSquare",
    sourceType: "task",
    sourceId: task.id,
  })

  revalidatePath(`/tasks/${data.board_id}`)
  return { success: true }
}

export async function updateTask(
  id: string,
  boardId: string,
  _prev: TaskActionState,
  formData: FormData
): Promise<TaskActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = taskSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("tasks")
    .update({
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date || null,
      assigned_to: data.assigned_to || null,
      contact_id: data.contact_id || null,
      company_id: data.company_id || null,
      deal_id: data.deal_id || null,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function moveTask(
  taskId: string,
  newColumnId: string,
  newPosition: number,
  boardId: string
): Promise<TaskActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get current task state
  const { data: task } = await supabase
    .from("tasks")
    .select("column_id, title")
    .eq("id", taskId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!task) return { error: "Task not found" }

  const oldColumnId = task.column_id

  const { error } = await supabase
    .from("tasks")
    .update({
      column_id: newColumnId,
      position: newPosition,
    })
    .eq("id", taskId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Log column change activity
  if (oldColumnId !== newColumnId) {
    // Fetch column names for the activity log
    const { data: columns } = await supabase
      .from("board_columns")
      .select("id, name")
      .in("id", [oldColumnId, newColumnId])

    const oldCol = columns?.find((c) => c.id === oldColumnId)
    const newCol = columns?.find((c) => c.id === newColumnId)

    await supabase.from("activities").insert({
      org_id: ctx.orgId,
      type: "TASK_STATUS_CHANGED",
      title: `Moved "${task.title}" from ${oldCol?.name ?? "unknown"} to ${newCol?.name ?? "unknown"}`,
      metadata: { task_id: taskId, from_column: oldColumnId, to_column: newColumnId },
      created_by: ctx.userId,
    })

    await notifyOrgMembers({
      orgId: ctx.orgId,
      performerUserId: ctx.userId,
      category: "task",
      title: `Task moved: "${task.title}" → ${newCol?.name ?? "unknown"}`,
      link: `/tasks/${boardId}`,
      icon: "CheckSquare",
      sourceType: "task",
      sourceId: taskId,
    })

    // Trigger automations
    await runAutomations(ctx.orgId, ctx.userId, "TASK_STATUS_CHANGED", {
      task_id: taskId,
      task_title: task.title,
      from_column: oldColumnId,
      to_column: newColumnId,
      from_column_name: oldCol?.name,
      to_column_name: newCol?.name,
    })
  }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function assignTask(
  taskId: string,
  userId: string | null,
  boardId: string
): Promise<TaskActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!task) return { error: "Task not found" }

  const { error } = await supabase
    .from("tasks")
    .update({ assigned_to: userId })
    .eq("id", taskId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Log assignment activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    type: "TASK_ASSIGNED",
    title: userId
      ? `Assigned "${task.title}"`
      : `Unassigned "${task.title}"`,
    metadata: { task_id: taskId, assigned_to: userId },
    created_by: ctx.userId,
  })

  // Direct notification to the assignee (not broadcast)
  if (userId && userId !== ctx.userId) {
    await createNotification({
      userId,
      orgId: ctx.orgId,
      title: `You were assigned: "${task.title}"`,
      link: `/tasks/${boardId}`,
      icon: "CheckSquare",
      sourceType: "task",
      sourceId: taskId,
    })
  }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function deleteTask(id: string, boardId: string): Promise<TaskActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}
