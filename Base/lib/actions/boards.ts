"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { boardSchema, boardColumnSchema } from "@/lib/validations/tasks"
import { DEFAULT_BOARD_COLUMNS } from "@/lib/types/tasks"

export type BoardActionState = {
  error?: string
  success?: boolean
}

export async function createBoard(
  _prev: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = boardSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { data: board, error } = await supabase
    .from("boards")
    .insert({
      org_id: ctx.orgId,
      name: data.name,
      description: data.description || null,
      metadata: data.metadata ?? null,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Create default columns
  const columns = DEFAULT_BOARD_COLUMNS.map((col, i) => ({
    board_id: board.id,
    name: col.name,
    color: col.color,
    position: i,
  }))

  const { error: colError } = await supabase
    .from("board_columns")
    .insert(columns)

  if (colError) return { error: colError.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    type: "TASK_CREATED",
    title: `Created board "${data.name}"`,
    metadata: { board_id: board.id },
    created_by: ctx.userId,
  })

  revalidatePath("/tasks")
  return { success: true }
}

export async function updateBoard(
  id: string,
  _prev: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = boardSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("boards")
    .update({
      name: data.name,
      description: data.description || null,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  revalidatePath(`/tasks/${id}`)
  return { success: true }
}

export async function deleteBoard(id: string): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("boards")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function archiveBoard(id: string, archived: boolean): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("boards")
    .update({ archived })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

// --- Column Actions ---

export async function createColumn(
  boardId: string,
  _prev: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = boardColumnSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  // Get next position
  const { count } = await supabase
    .from("board_columns")
    .select("*", { count: "exact", head: true })
    .eq("board_id", boardId)

  const { error } = await supabase
    .from("board_columns")
    .insert({
      board_id: boardId,
      name: data.name,
      position: count ?? 0,
      wip_limit: data.wip_limit ?? null,
      color: data.color || null,
    })

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function updateColumn(
  columnId: string,
  boardId: string,
  _prev: BoardActionState,
  formData: FormData
): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = boardColumnSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("board_columns")
    .update({
      name: data.name,
      wip_limit: data.wip_limit ?? null,
      color: data.color || null,
    })
    .eq("id", columnId)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function deleteColumn(columnId: string, boardId: string): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("board_columns")
    .delete()
    .eq("id", columnId)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function reorderColumns(
  boardId: string,
  columnIds: string[]
): Promise<BoardActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Update positions in order
  for (let i = 0; i < columnIds.length; i++) {
    const { error } = await supabase
      .from("board_columns")
      .update({ position: i })
      .eq("id", columnIds[i])

    if (error) return { error: error.message }
  }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}
