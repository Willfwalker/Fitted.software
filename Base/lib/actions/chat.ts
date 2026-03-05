"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"
import type { ChatMessage, ChatRole, ChatJobStatus } from "@/lib/types/chat"

export async function getChatMessages(limit = 50, offset = 0) {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)

  return { data: data as ChatMessage[] | null, error: error?.message ?? null }
}

export async function createChatMessage(
  role: ChatRole,
  content: string,
  jobId?: string,
  jobStatus?: ChatJobStatus
) {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      org_id: ctx.orgId,
      created_by: ctx.userId,
      role,
      content,
      job_id: jobId ?? null,
      job_status: jobStatus ?? null,
    })
    .select()
    .single()

  return { data: data as ChatMessage | null, error: error?.message ?? null }
}

export async function updateChatMessageStatus(
  messageId: string,
  status: ChatJobStatus,
  detail?: Record<string, unknown>
) {
  const ctx = await getOrgId()
  if (!ctx) return { data: null, error: "Not authenticated" }

  const supabase = await createClient()

  const update: Record<string, unknown> = { job_status: status }
  if (detail) update.job_detail = detail

  const { data, error } = await supabase
    .from("chat_messages")
    .update(update)
    .eq("id", messageId)
    .eq("org_id", ctx.orgId)
    .select()
    .single()

  return { data: data as ChatMessage | null, error: error?.message ?? null }
}
