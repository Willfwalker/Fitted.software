"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sparkles } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { FeatureRequestForm } from "@/components/chat/FeatureRequestForm"
import { RequestStatus } from "@/components/chat/RequestStatus"
import { RequestHistory } from "@/components/chat/RequestHistory"
import { buildPrompt } from "@/lib/chat/build-prompt"
import { assessDifficulty } from "@/lib/chat/assess-difficulty"
import type { FeatureRequest, ChatJobStatus, DifficultyAssessment } from "@/lib/types/chat"

interface ChatPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PanelView = "form" | "status" | "history"

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const [view, setView] = useState<PanelView>("form")
  const [submitting, setSubmitting] = useState(false)
  const [jobStatus, setJobStatus] = useState<ChatJobStatus>("pending")
  const [summary, setSummary] = useState<string | null>(null)
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [difficulty, setDifficulty] = useState<DifficultyAssessment | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const pollJobStatus = useCallback((jobId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${jobId}`)
        if (!res.ok) return

        const data = await res.json()
        const terminal = ["complete", "rejected", "failed"].includes(data.status)

        setJobStatus(data.status)

        if (terminal) {
          if (pollRef.current) clearInterval(pollRef.current)
          pollRef.current = null

          if (data.status === "complete") {
            setSummary(data.summary || "Changes applied successfully.")
            setPrUrl(data.pr_url || null)
          } else if (data.status === "rejected") {
            setError(data.reason || "Request was not approved.")
          } else {
            setError(data.error || "Something went wrong.")
          }
        }
      } catch {
        // Silently retry on next interval
      }
    }, 3000)
  }, [])

  async function handleSubmit(request: FeatureRequest) {
    setSubmitting(true)

    const taskPrompt = buildPrompt(request)

    // Assess difficulty immediately based on feature type
    const assessment = assessDifficulty(request)
    setDifficulty(assessment)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: taskPrompt, featureRequest: request }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        setError(err.error || "Something went wrong.")
        setJobStatus("failed")
        setView("status")
        setSubmitting(false)
        return
      }

      const data = await res.json()

      // Switch to status view
      setJobStatus("running")
      setSummary(null)
      setPrUrl(null)
      setError(null)
      setView("status")

      if (data.jobId) {
        pollJobStatus(data.jobId)
      }
    } catch {
      setError("Failed to submit request. Please try again.")
      setJobStatus("failed")
      setView("status")
    } finally {
      setSubmitting(false)
    }
  }

  function handleNewRequest() {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = null
    setView("form")
    setJobStatus("pending")
    setSummary(null)
    setPrUrl(null)
    setError(null)
    setDifficulty(null)
  }

  const descriptions: Record<PanelView, string> = {
    form: "Tell us what you need and the AI will build it for you.",
    status: "Your request is being processed.",
    history: "View your past feature requests.",
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="sm:max-w-md w-full flex flex-col gap-0 overflow-hidden bg-[var(--bg)] border-[var(--border)]"
      >
        <SheetHeader className="border-b border-[var(--border)] pb-0">
          <SheetTitle className="flex items-center gap-2 text-[var(--text)]">
            <Sparkles className="size-4 text-[var(--accent)]" />
            Add a Feature
          </SheetTitle>
          <SheetDescription className="text-[var(--text-muted)] text-xs">
            {descriptions[view]}
          </SheetDescription>

          {/* Tabs */}
          {view !== "status" && (
            <div className="flex gap-0 mt-2">
              <button
                type="button"
                onClick={() => setView("form")}
                className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  view === "form"
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                    : "text-[var(--text-dim)] hover:text-[var(--text-muted)] border-b-2 border-transparent"
                }`}
              >
                New Request
              </button>
              <button
                type="button"
                onClick={() => setView("history")}
                className={`px-4 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  view === "history"
                    ? "text-[var(--accent)] border-b-2 border-[var(--accent)]"
                    : "text-[var(--text-dim)] hover:text-[var(--text-muted)] border-b-2 border-transparent"
                }`}
              >
                Past Requests
              </button>
            </div>
          )}
        </SheetHeader>

        {view === "form" && (
          <FeatureRequestForm onSubmit={handleSubmit} submitting={submitting} />
        )}

        {view === "status" && (
          <RequestStatus
            status={jobStatus}
            summary={summary}
            prUrl={prUrl}
            error={error}
            difficulty={difficulty}
            onNewRequest={handleNewRequest}
          />
        )}

        {view === "history" && (
          <RequestHistory onNewRequest={() => setView("form")} />
        )}
      </SheetContent>
    </Sheet>
  )
}
