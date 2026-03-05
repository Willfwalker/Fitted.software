"use client"

import { Loader2, Check, X, AlertCircle } from "lucide-react"
import type { ChatMessage as ChatMessageType } from "@/lib/types/chat"

function StatusIcon({ status }: { status: ChatMessageType["job_status"] }) {
  switch (status) {
    case "pending":
    case "running":
      return <Loader2 className="size-4 animate-spin text-[var(--accent)]" />
    case "complete":
      return <Check className="size-4 text-emerald-400" />
    case "rejected":
      return <AlertCircle className="size-4 text-yellow-400" />
    case "failed":
      return <X className="size-4 text-red-400" />
    default:
      return null
  }
}

export function ChatMessageBubble({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user"
  const isStatus = message.role === "status"

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-[var(--accent)] text-white"
            : "bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border)]"
        }`}
      >
        {isStatus && (
          <div className="flex items-center gap-2 mb-1">
            <StatusIcon status={message.job_status} />
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide">
              {message.job_status === "running" ? "Processing" : message.job_status}
            </span>
          </div>
        )}
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        {typeof message.job_detail?.pr_url === "string" && (
          <a
            href={message.job_detail.pr_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-xs text-[var(--accent)] underline"
          >
            View Pull Request
          </a>
        )}
      </div>
    </div>
  )
}
