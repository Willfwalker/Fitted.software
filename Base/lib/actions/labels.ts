"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { labelSchema } from "@/lib/validations/tasks"

export type LabelActionState = {
  error?: string
  success?: boolean
}

export async function createLabel(
  _prev: LabelActionState,
  formData: FormData
): Promise<LabelActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = labelSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("labels")
    .insert({
      org_id: ctx.orgId,
      name: data.name,
      color: data.color,
    })

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function updateLabel(
  id: string,
  _prev: LabelActionState,
  formData: FormData
): Promise<LabelActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = labelSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from("labels")
    .update({
      name: data.name,
      color: data.color,
    })
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function deleteLabel(id: string): Promise<LabelActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/tasks")
  return { success: true }
}

export async function addLabelToTask(
  taskId: string,
  labelId: string,
  boardId: string
): Promise<LabelActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("task_labels")
    .insert({
      task_id: taskId,
      label_id: labelId,
    })

  if (error) {
    if (error.code === "23505") return { success: true } // already exists
    return { error: error.message }
  }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}

export async function removeLabelFromTask(
  taskId: string,
  labelId: string,
  boardId: string
): Promise<LabelActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("task_labels")
    .delete()
    .eq("task_id", taskId)
    .eq("label_id", labelId)

  if (error) return { error: error.message }

  revalidatePath(`/tasks/${boardId}`)
  return { success: true }
}
