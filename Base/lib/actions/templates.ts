"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import { messageTemplateSchema } from "@/lib/validations/messaging"
import type { MessageTemplate } from "@/lib/types/messaging"

export type TemplateActionState = {
  error?: string
  success?: boolean
  templateId?: string
}

export async function createTemplate(
  data: {
    name: string
    subject?: string
    body: string
    channel?: "EMAIL" | "SMS"
    variables?: string[]
  }
): Promise<TemplateActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = messageTemplateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Extract variables from body ({{variable}})
  const extractedVars = extractVariables(d.body)
  if (d.subject) {
    extractedVars.push(...extractVariables(d.subject))
  }
  const uniqueVars = [...new Set([...extractedVars, ...(d.variables || [])])]

  const { data: template, error } = await supabase
    .from("message_templates")
    .insert({
      org_id: ctx.orgId,
      name: d.name,
      subject: d.subject || null,
      body: d.body,
      channel: d.channel || "EMAIL",
      variables: uniqueVars,
      created_by: ctx.userId,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidatePath("/messages/templates")
  return { success: true, templateId: template.id }
}

export async function updateTemplate(
  id: string,
  data: {
    name: string
    subject?: string
    body: string
    channel?: "EMAIL" | "SMS"
    variables?: string[]
  }
): Promise<TemplateActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = messageTemplateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()

  // Extract variables from body and subject
  const extractedVars = extractVariables(d.body)
  if (d.subject) {
    extractedVars.push(...extractVariables(d.subject))
  }
  const uniqueVars = [...new Set([...extractedVars, ...(d.variables || [])])]

  const { error } = await supabase
    .from("message_templates")
    .update({
      name: d.name,
      subject: d.subject || null,
      body: d.body,
      channel: d.channel || "EMAIL",
      variables: uniqueVars,
    })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/messages/templates")
  return { success: true }
}

export async function deleteTemplate(id: string): Promise<TemplateActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("message_templates")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/messages/templates")
  return { success: true }
}

export async function getTemplates(): Promise<{ data: MessageTemplate[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("message_templates")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as MessageTemplate[] }
}

/**
 * Extract {{variable}} names from a template string.
 */
function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return matches.map((m) => m.replace(/\{\{|\}\}/g, ""))
}
