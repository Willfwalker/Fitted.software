"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Sparkles } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ChatMessageBubble } from "@/components/chat/ChatMessage"
import { getChatMessages } from "@/lib/actions/chat"
import type { ChatMessage } from "@/lib/types/chat"

interface ChatPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Load chat history when panel opens
  useEffect(() => {
    if (open && !loaded) {
      getChatMessages().then(({ data }) => {
        if (data) setMessages(data)
        setLoaded(true)
      })
    }
  }, [open, loaded])

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const pollJobStatus = useCallback((jobId: string, statusMessageId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${jobId}`)
        if (!res.ok) return

        const data = await res.json()
        const terminal = ["complete", "rejected", "failed"].includes(data.status)

        if (terminal) {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null

          // Update status message → assistant message with result
          setMessages((prev) =>
            prev.map((m) =>
              m.id === statusMessageId
                ? {
                    ...m,
                    role: "assistant" as const,
                    content:
                      data.status === "complete"
                        ? data.summary || "Changes applied successfully."
                        : data.status === "rejected"
                          ? data.reason || "Request was not approved."
                          : data.error || "Something went wrong.",
                    job_status: data.status,
                    job_detail: data.pr_url ? { pr_url: data.pr_url } : null,
                  }
                : m
            )
          )
        }
      } catch {
        // Silently retry on next interval
      }
    }, 3000)
  }, [])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setSending(true)
    setInput("")

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      org_id: "",
      created_by: "",
      role: "user",
      content: trimmed,
      job_id: null,
      job_status: null,
      job_detail: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMsg])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        setMessages((prev) => [
          ...prev,
          {
            ...tempUserMsg,
            id: `err-${Date.now()}`,
            role: "assistant",
            content: err.error || "Something went wrong.",
            job_status: "failed",
          },
        ])
        setSending(false)
        return
      }

      const { jobId, statusMessageId } = await res.json()

      // Add status message
      const statusMsg: ChatMessage = {
        id: statusMessageId || `status-${Date.now()}`,
        org_id: "",
        created_by: "",
        role: "status",
        content: "Working on it...",
        job_id: jobId,
        job_status: "running",
        job_detail: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, statusMsg])

      // Start polling
      if (jobId) {
        pollJobStatus(jobId, statusMsg.id)
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          ...tempUserMsg,
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Failed to send message. Please try again.",
          job_status: "failed",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="sm:max-w-md w-full flex flex-col bg-[var(--bg)] border-[var(--border)]"
      >
        <SheetHeader className="border-b border-[var(--border)] pb-3">
          <SheetTitle className="flex items-center gap-2 text-[var(--text)]">
            <Sparkles className="size-4 text-[var(--accent)]" />
            Add a Feature
          </SheetTitle>
          <SheetDescription className="text-[var(--text-muted)] text-xs">
            Describe what you want and the AI will build it for you.
          </SheetDescription>
        </SheetHeader>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-dim)]">
              <Sparkles className="size-8 mb-3 text-[var(--accent)] opacity-50" />
              <p className="text-sm">No messages yet.</p>
              <p className="text-xs mt-1">
                Describe a feature and the AI will implement it.
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-[var(--border)] p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a feature..."
              disabled={sending}
              className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-[var(--accent)] p-2 text-white hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
