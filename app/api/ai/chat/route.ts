import { streamText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { createClient } from "@/lib/supabase/server"
import { createAllTools } from "@/lib/ai/tools"
import { buildSystemPrompt } from "@/lib/ai/system-prompt"
import { getWorkspaceState } from "@/lib/ai/tool-executor"

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Get org
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  if (!membership) {
    return new Response("No organization found", { status: 403 })
  }

  const orgId = membership.org_id
  const userId = user.id

  const { messages, conversationId } = await req.json()

  // Build workspace context for system prompt
  const { pages, blocks } = await getWorkspaceState(orgId)
  const workspaceContext = pages.length > 0
    ? `Current pages:\n${pages
        .map(
          (p: any) =>
            `- "${p.title}" (id: ${p.id}, slug: ${p.slug}, icon: ${p.icon}, ${
              p.is_default ? "DEFAULT" : ""
            }) — ${blocks.filter((b: any) => b.page_id === p.id).length} blocks`
        )
        .join("\n")}`
    : "No workspace pages exist yet."

  const systemPrompt = buildSystemPrompt(workspaceContext)
  const tools = createAllTools(orgId, userId)

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: systemPrompt,
    messages,
    tools,
    maxSteps: 10,
  })

  return result.toDataStreamResponse()
}
