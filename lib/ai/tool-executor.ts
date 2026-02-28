import { createClient } from "@/lib/supabase/server"

interface AuditLogEntry {
  orgId: string
  userId: string
  conversationId?: string
  actionType: string
  targetTable: string
  targetId?: string
  beforeState?: Record<string, unknown> | null
  afterState?: Record<string, unknown> | null
  description: string
}

export async function logAIAction(entry: AuditLogEntry) {
  const supabase = await createClient()

  await supabase.from("ai_actions").insert({
    org_id: entry.orgId,
    user_id: entry.userId,
    conversation_id: entry.conversationId || null,
    action_type: entry.actionType,
    target_table: entry.targetTable,
    target_id: entry.targetId || null,
    before_state: entry.beforeState || null,
    after_state: entry.afterState || null,
    description: entry.description,
  })
}

export async function getWorkspaceState(orgId: string) {
  const supabase = await createClient()

  const [pagesRes, blocksRes] = await Promise.all([
    supabase
      .from("workspace_pages")
      .select("*")
      .eq("org_id", orgId)
      .order("sort_order"),
    supabase.from("workspace_blocks").select("*").eq("org_id", orgId),
  ])

  const pages = pagesRes.data || []
  const blocks = blocksRes.data || []

  return { pages, blocks }
}
