import { z } from "zod"
import { tool } from "ai"
import { createClient } from "@/lib/supabase/server"
import { logAIAction } from "../tool-executor"

export function createNavigationTools(orgId: string, userId: string) {
  return {
    update_nav: tool({
      description:
        "Reorder workspace pages in the sidebar or pin/unpin them.",
      parameters: z.object({
        page_order: z
          .array(
            z.object({
              page_id: z.string(),
              sort_order: z.number(),
              is_pinned: z.boolean().optional(),
            })
          )
          .describe("Array of page IDs with their new sort order"),
      }),
      execute: async ({ page_order }) => {
        const supabase = await createClient()

        for (const item of page_order) {
          const updates: Record<string, unknown> = {
            sort_order: item.sort_order,
          }
          if (item.is_pinned !== undefined) {
            updates.is_pinned = item.is_pinned
          }

          await supabase
            .from("workspace_pages")
            .update(updates)
            .eq("id", item.page_id)
            .eq("org_id", orgId)
        }

        await logAIAction({
          orgId,
          userId,
          actionType: "update_nav",
          targetTable: "workspace_pages",
          afterState: { page_order },
          description: "Updated sidebar navigation order",
        })

        return { success: true, message: "Navigation updated." }
      },
    }),
  }
}
