"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { noteSchema } from "@/lib/validations/crm"
import type { ActivityType } from "@/lib/types/crm"

export type ActivityActionState = {
  error?: string
  success?: boolean
}

export async function createActivity(
  entityType: "contact" | "deal" | "company",
  entityId: string,
  _prev: ActivityActionState,
  formData: FormData
): Promise<ActivityActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const raw = Object.fromEntries(formData)
  const parsed = noteSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const insert: Record<string, unknown> = {
    org_id: ctx.orgId,
    type: data.type as ActivityType,
    title: data.title,
    content: data.content || null,
    created_by: ctx.userId,
  }

  if (entityType === "contact") insert.contact_id = entityId
  if (entityType === "deal") insert.deal_id = entityId
  if (entityType === "company") insert.company_id = entityId

  const { error } = await supabase.from("activities").insert(insert)
  if (error) return { error: error.message }

  revalidatePath(`/crm/${entityType === "contact" ? "contacts" : entityType === "company" ? "companies" : "deals"}/${entityId}`)
  return { success: true }
}
