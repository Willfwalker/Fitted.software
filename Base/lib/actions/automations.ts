"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { automationSchema } from "@/lib/validations/automations"
import type { Automation, AutomationLog } from "@/lib/types/automations"

export type AutomationActionState = {
  error?: string
  success?: boolean
  automationId?: string
}

export async function createAutomation(
  data: {
    name: string
    description?: string
    trigger_type: string
    trigger_config?: Record<string, unknown>
    action_type: string
    action_config?: Record<string, unknown>
    enabled?: boolean
  }
): Promise<AutomationActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = automationSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  const { data: automation, error } = await supabase
    .from("automations")
    .insert({
      org_id: ctx.orgId,
      name: d.name,
      description: d.description || null,
      trigger_type: d.trigger_type,
      trigger_config: d.trigger_config,
      action_type: d.action_type,
      action_config: d.action_config,
      enabled: d.enabled,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/automations")
  return { success: true, automationId: automation.id }
}

export async function updateAutomation(
  id: string,
  data: {
    name?: string
    description?: string
    trigger_type?: string
    trigger_config?: Record<string, unknown>
    action_type?: string
    action_config?: Record<string, unknown>
    enabled?: boolean
  }
): Promise<AutomationActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name
  if (data.description !== undefined) update.description = data.description || null
  if (data.trigger_type !== undefined) update.trigger_type = data.trigger_type
  if (data.trigger_config !== undefined) update.trigger_config = data.trigger_config
  if (data.action_type !== undefined) update.action_type = data.action_type
  if (data.action_config !== undefined) update.action_config = data.action_config
  if (data.enabled !== undefined) update.enabled = data.enabled

  const { error } = await supabase
    .from("automations")
    .update(update)
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/automations")
  revalidatePath(`/automations/${id}`)
  return { success: true }
}

export async function deleteAutomation(id: string): Promise<AutomationActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("automations")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/automations")
  return { success: true }
}

export async function toggleAutomation(
  id: string,
  enabled: boolean
): Promise<AutomationActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("automations")
    .update({ enabled })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/automations")
  return { success: true }
}

export async function getAutomations(): Promise<{ data: Automation[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as Automation[] }
}

export async function getAutomation(id: string): Promise<{ data: Automation | null; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("automations")
    .select("*")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as Automation }
}

export async function getAutomationLogs(
  automationId: string,
  limit: number = 50
): Promise<{ data: AutomationLog[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("automation_logs")
    .select("*")
    .eq("automation_id", automationId)
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as AutomationLog[] }
}
