"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "@/lib/actions/helpers"
import { revalidatePath } from "next/cache"

export async function createWorkspacePage(data: {
  title: string
  slug: string
  icon?: string
  description?: string
  layout?: { columns: number; gap: number }
}) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get next sort_order
  const { data: pages } = await supabase
    .from("workspace_pages")
    .select("sort_order")
    .eq("org_id", ctx.orgId)
    .order("sort_order", { ascending: false })
    .limit(1)

  const nextOrder = (pages?.[0]?.sort_order ?? -1) + 1

  const { data: page, error } = await supabase
    .from("workspace_pages")
    .insert({
      org_id: ctx.orgId,
      slug: data.slug,
      title: data.title,
      icon: data.icon || "LayoutDashboard",
      description: data.description || null,
      layout: data.layout || { columns: 4, gap: 16 },
      sort_order: nextOrder,
      created_by: ctx.userId,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { page }
}

export async function updateWorkspacePage(
  pageId: string,
  updates: {
    title?: string
    icon?: string
    description?: string
    layout?: { columns: number; gap: number }
    sort_order?: number
    is_pinned?: boolean
  }
) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("workspace_pages")
    .update(updates)
    .eq("id", pageId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteWorkspacePage(pageId: string) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("workspace_pages")
    .delete()
    .eq("id", pageId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function addWorkspaceBlock(data: {
  page_id: string
  block_type: string
  config: Record<string, unknown>
  col_span?: number
  position?: number
}) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get next position if not specified
  let position = data.position
  if (position === undefined) {
    const { data: blocks } = await supabase
      .from("workspace_blocks")
      .select("position")
      .eq("page_id", data.page_id)
      .order("position", { ascending: false })
      .limit(1)

    position = (blocks?.[0]?.position ?? -1) + 1
  }

  const { data: block, error } = await supabase
    .from("workspace_blocks")
    .insert({
      page_id: data.page_id,
      org_id: ctx.orgId,
      block_type: data.block_type,
      config: data.config,
      col_span: data.col_span || 1,
      position,
      created_by: ctx.userId,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { block }
}

export async function updateWorkspaceBlock(
  blockId: string,
  updates: {
    config?: Record<string, unknown>
    col_span?: number
    position?: number
  }
) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("workspace_blocks")
    .update(updates)
    .eq("id", blockId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function removeWorkspaceBlock(blockId: string) {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()
  const { error } = await supabase
    .from("workspace_blocks")
    .delete()
    .eq("id", blockId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}
