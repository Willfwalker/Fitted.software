"use client"

import type { Message } from "ai"
import { ToolCallCard } from "./ToolCallCard"
import { Sparkles, User } from "lucide-react"

interface AIChatMessageProps {
  message: Message
}

export function AIChatMessage({ message }: AIChatMessageProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[rgba(212,115,78,0.1)] flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2} />
        </div>
      )}

      <div className={`max-w-[85%] space-y-1 ${isUser ? "items-end" : ""}`}>
        {/* Text content */}
        {message.content && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-[0.84rem] font-light leading-relaxed ${
              isUser
                ? "bg-[var(--accent)] text-white rounded-br-md"
                : "bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-bl-md border border-[var(--border)]"
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}

        {/* Tool calls */}
        {message.parts?.map((part, i) => {
          if (part.type === "tool-invocation") {
            return (
              <ToolCallCard
                key={i}
                toolName={part.toolInvocation.toolName}
                args={part.toolInvocation.args}
                result={part.toolInvocation.state === "result" ? part.toolInvocation.result : undefined}
                isLoading={part.toolInvocation.state === "call"}
              />
            )
          }
          return null
        })}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-[var(--text-dim)]" strokeWidth={2} />
        </div>
      )}
    </div>
  )
}
