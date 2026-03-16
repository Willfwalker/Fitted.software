import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Check role — only OWNER/ADMIN can access AI features
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)

  const role = memberships?.[0]?.role
  if (role === "MEMBER") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
  }

  const aiServerUrl = process.env.AI_SERVER_URL
  if (!aiServerUrl) {
    return NextResponse.json({ error: "AI server not configured" }, { status: 500 })
  }

  // Poll AI server for job status
  const res = await fetch(`${aiServerUrl}/api/job/${jobId}`)
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to get job status" }, { status: 502 })
  }

  const job = await res.json()

  // Map AI server status to our enum
  const statusMap: Record<string, string> = {
    pending: "pending",
    running: "running",
    complete: "complete",
    completed: "complete",
    rejected: "rejected",
    failed: "failed",
    error: "failed",
  }
  const mappedStatus = statusMap[job.status] || "running"

  // If terminal status, update the chat message
  if (["complete", "rejected", "failed"].includes(mappedStatus)) {
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .limit(1)

    const orgId = memberships?.[0]?.org_id
    if (orgId) {
      const content = mappedStatus === "complete"
        ? job.summary || "Changes have been applied successfully."
        : mappedStatus === "rejected"
          ? job.reason || "This request was not approved."
          : job.error || "Something went wrong."

      await supabase
        .from("chat_messages")
        .update({
          job_status: mappedStatus,
          content,
          job_detail: job,
        })
        .eq("job_id", jobId)
        .eq("org_id", orgId)
    }
  }

  return NextResponse.json({
    jobId,
    status: mappedStatus,
    summary: job.summary || null,
    reason: job.reason || null,
    error: job.error || null,
    pr_url: job.pr_url || null,
    difficulty: job.difficulty || null,
    difficulty_reason: job.difficulty_reason || null,
  })
}
