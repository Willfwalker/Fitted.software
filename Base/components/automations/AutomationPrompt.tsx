"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Zap, Sparkles, ArrowRight, Check, Loader2 } from "lucide-react"
import { TRIGGER_TYPES, ACTION_TYPES } from "@/lib/types/automations"

interface GeneratedAutomation {
  id: string
  name: string
  trigger_type: string
  action_type: string
  description: string | null
}

const EXAMPLES = [
  "When a deal is won, send a congratulations email to the team",
  "When a form is submitted, create a follow-up task",
  "When an invoice is overdue, send a notification to the account owner",
  "When a new email is received, create a task to respond within 24 hours",
  "When time is logged on a billable task, notify the project manager",
  "When a payment is received, create a calendar event for a thank-you call",
]

export function AutomationPrompt() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<GeneratedAutomation | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/automations/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || "Failed to generate automation")
      } else {
        setResult(data.automation as GeneratedAutomation)
      }
    } catch {
      setError("Network error — please try again")
    }

    setLoading(false)
  }

  const handleExample = (example: string) => {
    setPrompt(example)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (result) {
    const trigger = TRIGGER_TYPES.find((t) => t.value === result.trigger_type)
    const action = ACTION_TYPES.find((a) => a.value === result.action_type)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-[#5EC69A40] bg-[#5EC69A08]">
          <div className="h-8 w-8 rounded-full bg-[#5EC69A20] flex items-center justify-center shrink-0">
            <Check className="h-4 w-4 text-[#5EC69A]" />
          </div>
          <div>
            <p className="text-[0.9rem] font-medium text-[var(--text)]">
              Automation created
            </p>
            <p className="text-[0.8rem] text-[var(--text-muted)]">
              {result.name}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-[0.9rem] font-medium text-[var(--text)]">{result.name}</span>
          </div>
          {result.description && (
            <p className="text-[0.8rem] text-[var(--text-muted)] mb-4">{result.description}</p>
          )}
          <div className="flex items-center gap-2 text-[0.8rem]">
            <Badge
              variant="outline"
              className="text-[0.72rem] px-2 py-0.5 border-[var(--border)] text-[var(--text-muted)]"
            >
              {trigger?.label || result.trigger_type}
            </Badge>
            <ArrowRight className="h-3 w-3 text-[var(--text-dim)]" />
            <Badge
              variant="outline"
              className="text-[0.72rem] px-2 py-0.5 border-[var(--border)] text-[var(--text-muted)]"
            >
              {action?.label || result.action_type}
            </Badge>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setResult(null)
              setPrompt("")
            }}
            className="border-[var(--border)] text-[var(--text-muted)]"
          >
            Create Another
          </Button>
          <Button
            onClick={() => router.push(`/automations/${result.id}`)}
            className="bg-[var(--accent)] text-white hover:opacity-90"
          >
            View Automation
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/automations")}
            className="text-[var(--text-muted)]"
          >
            Back to List
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Prompt input */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe what you want to automate..."
          rows={4}
          disabled={loading}
          className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)] resize-none pr-12 text-[0.9rem] placeholder:text-[var(--text-dim)]"
        />
        <Button
          size="icon"
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="absolute bottom-3 right-3 h-8 w-8 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>

      <p className="text-[0.72rem] text-[var(--text-dim)]">
        {loading
          ? "Generating your automation..."
          : "Describe what should happen and when. Press Cmd+Enter to submit."}
      </p>

      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-3">
          <p className="text-[0.8rem] text-red-400">{error}</p>
        </div>
      )}

      {/* Examples */}
      {!loading && (
        <div>
          <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)] mb-3">
            Try an example
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => handleExample(example)}
                className="text-left rounded-lg border border-[var(--border)] p-3 text-[0.8rem] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
