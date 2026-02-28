import { z } from "zod"
import { tool } from "ai"
import { createClient } from "@/lib/supabase/server"
import { logAIAction, getWorkspaceState } from "../tool-executor"

export function createWorkspaceTools(orgId: string, userId: string) {
  return {
    get_workspace_state: tool({
      description:
        "Get the current workspace state including all pages and blocks. Call this first to understand what exists.",
      parameters: z.object({}),
      execute: async () => {
        const { pages, blocks } = await getWorkspaceState(orgId)
        return {
          pages: pages.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            icon: p.icon,
            is_default: p.is_default,
            sort_order: p.sort_order,
            block_count: blocks.filter((b: any) => b.page_id === p.id).length,
          })),
          blocks: blocks.map((b: any) => ({
            id: b.id,
            page_id: b.page_id,
            block_type: b.block_type,
            config: b.config,
            position: b.position,
            col_span: b.col_span,
          })),
        }
      },
    }),

    create_page: tool({
      description:
        "Create a new workspace page. It will appear in the sidebar navigation.",
      parameters: z.object({
        title: z.string().describe("Page title displayed in sidebar"),
        slug: z
          .string()
          .describe("URL-safe slug (lowercase, hyphens, no spaces)"),
        icon: z
          .string()
          .default("LayoutDashboard")
          .describe("Lucide icon name (e.g. TrendingUp, Users, DollarSign)"),
        description: z.string().optional().describe("Short page description"),
        columns: z
          .number()
          .min(1)
          .max(4)
          .default(4)
          .describe("Grid columns (1-4)"),
      }),
      execute: async ({ title, slug, icon, description, columns }) => {
        const supabase = await createClient()

        // Get next sort_order
        const { data: existing } = await supabase
          .from("workspace_pages")
          .select("sort_order")
          .eq("org_id", orgId)
          .order("sort_order", { ascending: false })
          .limit(1)

        const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1

        const { data: page, error } = await supabase
          .from("workspace_pages")
          .insert({
            org_id: orgId,
            slug,
            title,
            icon,
            description: description || null,
            layout: { columns, gap: 16 },
            sort_order: nextOrder,
            created_by: userId,
          })
          .select()
          .single()

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "create_page",
          targetTable: "workspace_pages",
          targetId: page.id,
          afterState: page,
          description: `Created workspace page "${title}"`,
        })

        return {
          success: true,
          page: {
            id: page.id,
            slug: page.slug,
            title: page.title,
          },
          message: `Page "${title}" created. Navigate to /dashboard/w/${slug} to view it.`,
        }
      },
    }),

    update_page: tool({
      description: "Update a workspace page's title, icon, or layout.",
      parameters: z.object({
        page_id: z.string().describe("The page ID to update"),
        title: z.string().optional(),
        icon: z.string().optional(),
        description: z.string().optional(),
        columns: z.number().min(1).max(4).optional(),
      }),
      execute: async ({ page_id, title, icon, description, columns }) => {
        const supabase = await createClient()

        // Get before state
        const { data: before } = await supabase
          .from("workspace_pages")
          .select("*")
          .eq("id", page_id)
          .single()

        const updates: Record<string, unknown> = {}
        if (title !== undefined) updates.title = title
        if (icon !== undefined) updates.icon = icon
        if (description !== undefined) updates.description = description
        if (columns !== undefined)
          updates.layout = { columns, gap: before?.layout?.gap || 16 }

        const { data: after, error } = await supabase
          .from("workspace_pages")
          .update(updates)
          .eq("id", page_id)
          .eq("org_id", orgId)
          .select()
          .single()

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "update_page",
          targetTable: "workspace_pages",
          targetId: page_id,
          beforeState: before,
          afterState: after,
          description: `Updated page "${after.title}"`,
        })

        return { success: true, page: after }
      },
    }),

    delete_page: tool({
      description:
        "Delete a workspace page and all its blocks. Cannot delete the default page.",
      parameters: z.object({
        page_id: z.string().describe("The page ID to delete"),
      }),
      execute: async ({ page_id }) => {
        const supabase = await createClient()

        const { data: page } = await supabase
          .from("workspace_pages")
          .select("*")
          .eq("id", page_id)
          .single()

        if (!page) return { error: "Page not found" }
        if (page.is_default)
          return { error: "Cannot delete the default page" }

        const { error } = await supabase
          .from("workspace_pages")
          .delete()
          .eq("id", page_id)
          .eq("org_id", orgId)

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "delete_page",
          targetTable: "workspace_pages",
          targetId: page_id,
          beforeState: page,
          description: `Deleted page "${page.title}"`,
        })

        return { success: true, message: `Page "${page.title}" deleted.` }
      },
    }),

    add_block: tool({
      description: "Add a block (widget) to a workspace page.",
      parameters: z.object({
        page_id: z.string().describe("The page to add the block to"),
        block_type: z
          .string()
          .describe(
            "Block type: stat-card, data-table, chart-area, chart-bar, chart-pie, kanban, activity-feed, list, text, form, quick-actions, metric-row, team-list, calendar, embed"
          ),
        config: z
          .record(z.unknown())
          .describe("Block configuration object (varies by block_type)"),
        col_span: z
          .number()
          .min(1)
          .max(4)
          .default(1)
          .describe("Width in grid columns (1-4)"),
      }),
      execute: async ({ page_id, block_type, config, col_span }) => {
        const supabase = await createClient()

        // Get next position
        const { data: blocks } = await supabase
          .from("workspace_blocks")
          .select("position")
          .eq("page_id", page_id)
          .order("position", { ascending: false })
          .limit(1)

        const nextPos = (blocks?.[0]?.position ?? -1) + 1

        const { data: block, error } = await supabase
          .from("workspace_blocks")
          .insert({
            page_id,
            org_id: orgId,
            block_type,
            config,
            col_span,
            position: nextPos,
            created_by: userId,
          })
          .select()
          .single()

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "add_block",
          targetTable: "workspace_blocks",
          targetId: block.id,
          afterState: block,
          description: `Added ${block_type} block to page`,
        })

        return {
          success: true,
          block: { id: block.id, block_type, position: nextPos },
        }
      },
    }),

    update_block: tool({
      description: "Update a block's configuration or size.",
      parameters: z.object({
        block_id: z.string().describe("The block ID to update"),
        config: z.record(z.unknown()).optional().describe("New config object"),
        col_span: z.number().min(1).max(4).optional(),
      }),
      execute: async ({ block_id, config, col_span }) => {
        const supabase = await createClient()

        const { data: before } = await supabase
          .from("workspace_blocks")
          .select("*")
          .eq("id", block_id)
          .single()

        const updates: Record<string, unknown> = {}
        if (config !== undefined) updates.config = config
        if (col_span !== undefined) updates.col_span = col_span

        const { data: after, error } = await supabase
          .from("workspace_blocks")
          .update(updates)
          .eq("id", block_id)
          .eq("org_id", orgId)
          .select()
          .single()

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "update_block",
          targetTable: "workspace_blocks",
          targetId: block_id,
          beforeState: before,
          afterState: after,
          description: `Updated ${before?.block_type} block`,
        })

        return { success: true, block: after }
      },
    }),

    remove_block: tool({
      description: "Remove a block from a page.",
      parameters: z.object({
        block_id: z.string().describe("The block ID to remove"),
      }),
      execute: async ({ block_id }) => {
        const supabase = await createClient()

        const { data: before } = await supabase
          .from("workspace_blocks")
          .select("*")
          .eq("id", block_id)
          .single()

        const { error } = await supabase
          .from("workspace_blocks")
          .delete()
          .eq("id", block_id)
          .eq("org_id", orgId)

        if (error) return { error: error.message }

        await logAIAction({
          orgId,
          userId,
          actionType: "remove_block",
          targetTable: "workspace_blocks",
          targetId: block_id,
          beforeState: before,
          description: `Removed ${before?.block_type} block`,
        })

        return { success: true, message: "Block removed." }
      },
    }),

    reorder_blocks: tool({
      description: "Reorder blocks on a page by setting new positions.",
      parameters: z.object({
        page_id: z.string(),
        block_order: z
          .array(z.string())
          .describe("Array of block IDs in desired order"),
      }),
      execute: async ({ page_id, block_order }) => {
        const supabase = await createClient()

        for (let i = 0; i < block_order.length; i++) {
          await supabase
            .from("workspace_blocks")
            .update({ position: i })
            .eq("id", block_order[i])
            .eq("org_id", orgId)
        }

        await logAIAction({
          orgId,
          userId,
          actionType: "reorder_blocks",
          targetTable: "workspace_blocks",
          afterState: { page_id, order: block_order },
          description: `Reordered blocks on page`,
        })

        return { success: true, message: "Blocks reordered." }
      },
    }),
  }
}
