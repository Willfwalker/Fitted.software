"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { dealSchema } from "@/lib/validations/crm"
import type { DealStage } from "@/lib/types/crm"

export type DealActionState = {
  error?: string
  success?: boolean
}

export async function createDeal(
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  // Extract metadata.* keys from FormData
  const metadata: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("metadata.")) {
      metadata[key.replace("metadata.", "")] = value
    }
  }

  const raw = { ...Object.fromEntries(formData), metadata }
  const parsed = dealSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  // Get next position in the stage
  const { count } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("org_id", ctx.orgId)
    .eq("stage", data.stage)

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      org_id: ctx.orgId,
      title: data.title,
      value: data.value ?? null,
      stage: data.stage,
      priority: data.priority,
      contact_id: data.contact_id || null,
      company_id: data.company_id || null,
      expected_close_date: data.expected_close_date || null,
      notes: data.notes || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      position: (count ?? 0),
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // Log activity
  await supabase.from("activities").insert({
    org_id: ctx.orgId,
    deal_id: deal.id,
    contact_id: data.contact_id || null,
    company_id: data.company_id || null,
    type: "DEAL_CREATED",
    title: `Created deal "${data.title}"`,
    metadata: { value: data.value, stage: data.stage },
    created_by: ctx.userId,
  })

  revalidatePath("/dashboard/crm/deals")
  return { success: true }
}

export async function updateDeal(
  id: string,
  _prev: DealActionState,
  formData: FormData
): Promise<DealActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  // Extract metadata.* keys from FormData
  const metadata: Record<string, unknown> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("metadata.")) {
      metadata[key.replace("metadata.", "")] = value
    }
  }

  const raw = { ...Object.fromEntries(formData), metadata }
  const parsed = dealSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const closedAt = (data.stage === "WON" || data.stage === "LOST") ? new Date().toISOString() : null

  const { error } = await supabase
    .from("deals")
    .update({
      title: data.title,
      value: data.value ?? null,
      stage: data.stage,
      priority: data.priority,
      contact_id: data.contact_id || null,
      company_id: data.company_id || null,
      expected_close_date: data.expected_close_date || null,
      notes: data.notes || null,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      closed_at: closedAt,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/crm/deals")
  return { success: true }
}

export async function moveDealStage(
  dealId: string,
  newStage: DealStage,
  newPosition: number
): Promise<DealActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get current deal state
  const { data: deal } = await supabase
    .from("deals")
    .select("stage, title")
    .eq("id", dealId)
    .eq("org_id", ctx.orgId)
    .single()

  if (!deal) return { error: "Deal not found" }

  const oldStage = deal.stage
  const closedAt = (newStage === "WON" || newStage === "LOST") ? new Date().toISOString() : null

  const { error } = await supabase
    .from("deals")
    .update({
      stage: newStage,
      position: newPosition,
      closed_at: closedAt,
    })
    .eq("id", dealId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  // Log stage change activity
  if (oldStage !== newStage) {
    await supabase.from("activities").insert({
      org_id: ctx.orgId,
      deal_id: dealId,
      type: "DEAL_STAGE_CHANGED",
      title: `Moved "${deal.title}" from ${oldStage} to ${newStage}`,
      metadata: { from: oldStage, to: newStage },
      created_by: ctx.userId,
    })
  }

  revalidatePath("/dashboard/crm/deals")
  return { success: true }
}

export async function deleteDeal(id: string): Promise<DealActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard/crm/deals")
  return { success: true }
}
