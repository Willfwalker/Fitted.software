"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, Reply } from "lucide-react"
import { replyToMessage } from "@/lib/actions/messages"
import type { Message, MessageDirection } from "@/lib/types/messaging"

interface MessageThreadProps {
  messages: Message[]
}

export function MessageThread({ messages }: MessageThreadProps) {
  const router = useRouter()
  const [replying, setReplying] = useState(false)
  const [replyBody, setReplyBody] = useState("")
  const [loading, setLoading] = useState(false)

  const rootMessage = messages[0]

  const handleReply = async () => {
    if (!replyBody.trim() || !rootMessage) return
    setLoading(true)

    const result = await replyToMessage(rootMessage.id, { body: replyBody })

    setLoading(false)
    if (result.success) {
      setReplyBody("")
      setReplying(false)
      router.refresh()
    }
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isInbound = msg.direction === "INBOUND"
        return (
          <div
            key={msg.id}
            className={`rounded-lg border border-[var(--border)] p-4 ${
              isInbound ? "bg-[var(--bg-elevated)]" : "bg-[var(--bg-card)]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              {isInbound ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-[#5B8DEF]" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-[#5EC69A]" />
              )}
              <span className="text-[0.8rem] font-medium text-[var(--text)]">
                {isInbound
                  ? msg.contact
                    ? `${msg.contact.first_name} ${msg.contact.last_name}`
                    : msg.recipient_email || "Unknown"
                  : "You"}
              </span>
              <Badge
                variant="outline"
                className="text-[0.65rem] px-1.5 py-0 border-0 font-medium"
                style={{
                  color: isInbound ? "#5B8DEF" : "#5EC69A",
                  backgroundColor: isInbound ? "#5B8DEF15" : "#5EC69A15",
                }}
              >
                {isInbound ? "Received" : "Sent"}
              </Badge>
              <span className="text-[0.72rem] text-[var(--text-dim)] ml-auto">
                {msg.sent_at
                  ? new Date(msg.sent_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : ""}
              </span>
            </div>
            {msg.subject && (
              <p className="text-[0.8rem] font-medium text-[var(--text)] mb-1">
                {msg.subject}
              </p>
            )}
            <p className="text-[0.8rem] text-[var(--text-muted)] whitespace-pre-wrap">
              {msg.body}
            </p>
          </div>
        )
      })}

      {!replying ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setReplying(true)}
          className="gap-1.5 border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]"
        >
          <Reply className="h-3.5 w-3.5" />
          Reply
        </Button>
      ) : (
        <div className="space-y-2 pt-2 border-t border-[var(--border)]">
          <Textarea
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setReplying(false)
                setReplyBody("")
              }}
              className="text-[var(--text-muted)]"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleReply}
              disabled={loading || !replyBody.trim()}
              className="bg-[var(--accent)] text-white hover:opacity-90"
            >
              {loading ? "Sending..." : "Send Reply"}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
