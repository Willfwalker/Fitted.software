"use client"

import { useState, useEffect } from "react"
import { Loader2, Check, X, AlertCircle, Clock, ExternalLink } from "lucide-react"
import { getChatMessages } from "@/lib/actions/chat"
import type { ChatMessage } from "@/lib/types/chat"

interface RequestHistoryProps {
  onNewRequest: () => void
}

function StatusBadge({ status }: { status: ChatMessage["job_status"] }) {
  switch (status) {
    case "running":
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(212,115,78,0.15)] px-2 py-0.5 text-xs text-[var(--accent)]">
          <Loader2 className="size-3 animate-spin" />
          In Progress
        </span>
      )
    case "complete":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(52,211,153,0.15)] px-2 py-0.5 text-xs text-emerald-400">
          <Check className="size-3" />
          Complete
        </span>
      )
    case "rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(250,204,21,0.15)] px-2 py-0.5 text-xs text-yellow-400">
          <AlertCircle className="size-3" />
          Rejected
        </span>
      )
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(248,113,113,0.15)] px-2 py-0.5 text-xs text-red-400">
          <X className="size-3" />
          Failed
        </span>
      )
    default:
      return null
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function extractTitle(content: string): string {
  // Try to pull a meaningful title from the prompt content
  const lines = content.split("\n")
  for (const line of lines) {
    if (line.startsWith("Page Name:")) return line.replace("Page Name:", "").trim()
    if (line.startsWith("Field Name(s):")) return line.replace("Field Name(s):", "").trim()
    if (line.startsWith("Element to Change:")) return line.replace("Element to Change:", "").trim()
    if (line.startsWith("Trigger:")) return line.replace("Trigger:", "").trim()
    if (line.startsWith("Service:")) return line.replace("Service:", "").trim()
    if (line.startsWith("Data to Visualize:")) return line.replace("Data to Visualize:", "").trim()
    if (line.startsWith("Description:")) return line.replace("Description:", "").trim()
  }
  // Fallback: first meaningful line
  const typeLine = lines.find((l) => l.startsWith("Feature Type:"))
  if (typeLine) return typeLine.replace("Feature Type:", "").trim()
  return content.slice(0, 60) + (content.length > 60 ? "..." : "")
}

function extractFeatureType(content: string): string | null {
  const match = content.match(/^Feature Type:\s*(.+)$/m)
  return match ? match[1].trim() : null
}

export function RequestHistory({ onNewRequest }: RequestHistoryProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChatMessages(100).then(({ data }) => {
      if (data) {
        // Group: show user messages that have a corresponding status/assistant message
        // We show user messages as the "request" entries
        setMessages(data)
      }
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 min-h-0">
        <Loader2 className="size-5 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  // Build request entries: pair user messages with their following status/assistant message
  const requests: {
    userMsg: ChatMessage
    statusMsg: ChatMessage | null
  }[] = []

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (msg.role === "user") {
      // Find the next non-user message
      const next = messages[i + 1]
      const statusMsg = next && next.role !== "user" ? next : null
      requests.push({ userMsg: msg, statusMsg })
    }
  }

  // Show newest first
  requests.reverse()

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-center px-4">
        <Clock className="size-8 text-[var(--text-dim)] mb-3" />
        <p className="text-sm text-[var(--text-muted)]">No past requests yet.</p>
        <p className="text-xs text-[var(--text-dim)] mt-1">Submit a feature request to get started.</p>
        <button
          type="button"
          onClick={onNewRequest}
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity cursor-pointer"
        >
          New Request
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-6 min-h-0 space-y-2">
        {requests.map(({ userMsg, statusMsg }) => {
          const title = extractTitle(userMsg.content)
          const featureType = extractFeatureType(userMsg.content)
          const status = statusMsg?.job_status ?? null
          const prUrl = typeof statusMsg?.job_detail?.pr_url === "string" ? statusMsg.job_detail.pr_url : null

          return (
            <div
              key={userMsg.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{title}</p>
                  {featureType && (
                    <p className="text-xs text-[var(--text-dim)] mt-0.5">{featureType}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-[var(--text-dim)]">
                  {formatDate(userMsg.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                {status && <StatusBadge status={status} />}
                {prUrl && (
                  <a
                    href={prUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline cursor-pointer"
                  >
                    <ExternalLink className="size-3" />
                    View PR
                  </a>
                )}
              </div>
              {statusMsg && statusMsg.role === "assistant" && statusMsg.content && (
                <p className="text-xs text-[var(--text-muted)] line-clamp-2">{statusMsg.content}</p>
              )}
            </div>
          )
        })}
      </div>
      <div className="shrink-0 border-t border-[var(--border)] p-4">
        <button
          type="button"
          onClick={onNewRequest}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity cursor-pointer"
        >
          New Request
        </button>
      </div>
    </div>
  )
}
