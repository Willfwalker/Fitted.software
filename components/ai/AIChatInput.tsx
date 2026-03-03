"use client"

import { useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface AIChatInputProps {
  input: string
  onInputChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function AIChatInput({
  input,
  onInputChange,
  onSubmit,
  isLoading,
}: AIChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as React.FormEvent)
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--border)] p-4">
      <div className="flex items-end gap-2 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border)] px-3 py-2 focus-within:border-[var(--accent)] transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything..."
          rows={1}
          className="flex-1 bg-transparent text-[0.85rem] text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none font-light resize-none leading-relaxed"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="shrink-0 w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center disabled:opacity-30 hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        </button>
      </div>
      <p className="text-[0.6rem] text-[var(--text-dim)] mt-2 px-1 opacity-60">
        AI can create pages, add widgets, and query your data
      </p>
    </form>
  )
}
