import { createClient } from "@/lib/supabase/server"
import type { WorkspacePage, WorkspaceBlock } from "@/lib/blocks/types"

export async function getWorkspacePages(orgId: string): Promise<WorkspacePage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspace_pages")
    .select("*")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true })

  return (data || []) as WorkspacePage[]
}

export async function getWorkspacePageBySlug(
  orgId: string,
  slug: string
): Promise<WorkspacePage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspace_pages")
    .select("*")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .single()

  return (data as WorkspacePage) || null
}

export async function getDefaultWorkspacePage(
  orgId: string
): Promise<WorkspacePage | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspace_pages")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_default", true)
    .single()

  return (data as WorkspacePage) || null
}

export async function getBlocksForPage(pageId: string): Promise<WorkspaceBlock[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("workspace_blocks")
    .select("*")
    .eq("page_id", pageId)
    .order("position", { ascending: true })

  return (data || []) as WorkspaceBlock[]
}
