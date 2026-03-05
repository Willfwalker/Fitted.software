export type ChatRole = "user" | "assistant" | "status"
export type ChatJobStatus = "pending" | "running" | "complete" | "rejected" | "failed"

export interface ChatMessage {
  id: string
  org_id: string
  created_by: string
  role: ChatRole
  content: string
  job_id: string | null
  job_status: ChatJobStatus | null
  job_detail: Record<string, unknown> | null
  created_at: string
}
