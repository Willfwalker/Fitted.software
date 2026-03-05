import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)

  const orgId = memberships?.[0]?.org_id
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 403 })

  const { message } = await request.json()
  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  const aiServerUrl = process.env.AI_SERVER_URL
  const repoUrl = process.env.GITHUB_REPO_URL
  if (!aiServerUrl || !repoUrl) {
    return NextResponse.json({ error: "AI server not configured" }, { status: 500 })
  }

  // Save user message
  const { data: userMsg, error: userErr } = await supabase
    .from("chat_messages")
    .insert({ org_id: orgId, created_by: user.id, role: "user", content: message })
    .select()
    .single()

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

  // Trigger AI agent
  let jobId: string | null = null
  try {
    const res = await fetch(`${aiServerUrl}/api/trigger-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_url: repoUrl, task_prompt: message }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`AI server returned ${res.status}: ${body}`)
    }

    const data = await res.json()
    jobId = data.job_id
  } catch (err) {
    // Save error as assistant message
    await supabase
      .from("chat_messages")
      .insert({
        org_id: orgId,
        created_by: user.id,
        role: "assistant",
        content: `Failed to reach AI server: ${err instanceof Error ? err.message : "Unknown error"}`,
        job_status: "failed",
      })

    return NextResponse.json({ error: "Failed to trigger AI agent" }, { status: 502 })
  }

  // Save assistant status message
  const { data: assistantMsg } = await supabase
    .from("chat_messages")
    .insert({
      org_id: orgId,
      created_by: user.id,
      role: "status",
      content: "Working on it...",
      job_id: jobId,
      job_status: "running",
    })
    .select()
    .single()

  return NextResponse.json({
    jobId,
    userMessageId: userMsg.id,
    statusMessageId: assistantMsg?.id,
  })
}
