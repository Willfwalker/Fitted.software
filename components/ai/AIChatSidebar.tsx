"use client"

import { useChat } from "@ai-sdk/react"
import { useState, useEffect, useRef } from "react"
import { X, Sparkles } from "lucide-react"
import { AIChatMessage } from "./AIChatMessage"
import { AIChatInput } from "./AIChatInput"

interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function AIChatSidebar({ isOpen, onClose }: AIChatSidebarProps) {
  const { messages, sendMessage, status } =
    useChat({
      api: "/api/ai/chat",
      maxSteps: 10,
    })

  const [input, setInput] = useState("")
  const isLoading = status === "streaming" || status === "submitted"

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[380px] max-w-[90vw] bg-[var(--bg-card)] border-l border-[var(--border)] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[rgba(212,115,78,0.1)] flex items-center justify-center">
              <Sparkles
                className="w-3.5 h-3.5 text-[var(--accent)]"
                strokeWidth={2}
              />
            </div>
            <div>
              <h2 className="text-[0.9rem] text-[var(--text)] font-light">
                AI Assistant
              </h2>
              <p className="text-[0.6rem] text-[var(--text-dim)]">
                Build your workspace
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[var(--text-dim)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-[rgba(212,115,78,0.08)] flex items-center justify-center mb-4">
                <Sparkles
                  className="w-6 h-6 text-[var(--accent)]"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-[0.9rem] text-[var(--text)] font-light mb-2">
                What would you like to build?
              </p>
              <p className="text-[0.75rem] text-[var(--text-dim)] font-light leading-relaxed max-w-[260px]">
                I can create pages, add charts and widgets, query your CRM data,
                and customize your workspace.
              </p>
              <div className="mt-6 space-y-2 w-full">
                {[
                  "Create a Sales Dashboard with deal stats",
                  "Show me my pipeline overview",
                  "Add a contacts table to my dashboard",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg border border-[var(--border)] text-[0.78rem] text-[var(--text-muted)] font-light hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <AIChatMessage key={message.id} message={message} />
          ))}

          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-[rgba(212,115,78,0.1)] flex items-center justify-center shrink-0">
                <Sparkles
                  className="w-3.5 h-3.5 text-[var(--accent)] animate-pulse"
                  strokeWidth={2}
                />
              </div>
              <div className="bg-[var(--bg-elevated)] rounded-2xl rounded-bl-md border border-[var(--border)] px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-dim)] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-dim)] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-dim)] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <AIChatInput
          input={input}
          onInputChange={setInput}
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim() && !isLoading) {
              sendMessage({ prompt: input })
              setInput("")
            }
          }}
          isLoading={isLoading}
        />
      </div>
    </>
  )
}
