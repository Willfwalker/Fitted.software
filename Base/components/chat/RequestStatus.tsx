"use client"

import { Loader2, Check, X, AlertCircle, Clock, Zap, Wrench } from "lucide-react"
import type { ChatJobStatus, DifficultyAssessment } from "@/lib/types/chat"

interface RequestStatusProps {
  status: ChatJobStatus
  summary: string | null
  prUrl: string | null
  error: string | null
  difficulty: DifficultyAssessment | null
  onNewRequest: () => void
}

function DifficultyCard({ assessment }: { assessment: DifficultyAssessment }) {
  const config = {
    easy: {
      icon: Zap,
      label: "Quick Change",
      eta: "1 - 5 minutes",
      color: "text-emerald-400",
      bg: "bg-[rgba(52,211,153,0.1)]",
      border: "border-[rgba(52,211,153,0.25)]",
      iconBg: "bg-[rgba(52,211,153,0.15)]",
    },
    medium: {
      icon: Wrench,
      label: "Moderate Change",
      eta: "30 - 60 minutes",
      color: "text-amber-400",
      bg: "bg-[rgba(251,191,36,0.1)]",
      border: "border-[rgba(251,191,36,0.25)]",
      iconBg: "bg-[rgba(251,191,36,0.15)]",
    },
    hard: {
      icon: Clock,
      label: "Involved Feature",
      eta: "1 - 2 days",
      color: "text-[var(--accent)]",
      bg: "bg-[rgba(212,115,78,0.08)]",
      border: "border-[rgba(212,115,78,0.25)]",
      iconBg: "bg-[rgba(212,115,78,0.15)]",
    },
  }

  const c = config[assessment.difficulty]
  const Icon = c.icon

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4 text-left space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-full ${c.iconBg} p-2`}>
          <Icon className={`size-4 ${c.color}`} />
        </div>
        <div>
          <div className={`text-sm font-medium ${c.color}`}>{c.label}</div>
          <div className="text-xs text-[var(--text-muted)]">
            Estimated time: <span className="text-[var(--text)] font-medium">{c.eta}</span>
          </div>
        </div>
      </div>
      {assessment.reason && (
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {assessment.reason}
        </p>
      )}
    </div>
  )
}

export function RequestStatus({ status, summary, prUrl, error, difficulty, onNewRequest }: RequestStatusProps) {
  const isTerminal = ["complete", "rejected", "failed"].includes(status)
  const isWorking = status === "pending" || status === "running"

  return (
    <div className="flex flex-col items-center justify-center flex-1 min-h-0 text-center px-4 py-6">
      <div className="w-full max-w-sm space-y-5">
        {/* Status card */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-4">
          {/* Status icon */}
          <div className="flex justify-center">
            {isWorking && (
              <div className="rounded-full bg-[rgba(212,115,78,0.15)] p-3">
                <Loader2 className="size-6 animate-spin text-[var(--accent)]" />
              </div>
            )}
            {status === "complete" && (
              <div className="rounded-full bg-[rgba(52,211,153,0.15)] p-3">
                <Check className="size-6 text-emerald-400" />
              </div>
            )}
            {status === "rejected" && (
              <div className="rounded-full bg-[rgba(250,204,21,0.15)] p-3">
                <AlertCircle className="size-6 text-yellow-400" />
              </div>
            )}
            {status === "failed" && (
              <div className="rounded-full bg-[rgba(248,113,113,0.15)] p-3">
                <X className="size-6 text-red-400" />
              </div>
            )}
          </div>

          {/* Status heading */}
          <div>
            <h3 className="text-sm font-medium text-[var(--text)]">
              {status === "pending" && "Queued..."}
              {status === "running" && "Working on it..."}
              {status === "complete" && "Complete!"}
              {status === "rejected" && "Request Not Approved"}
              {status === "failed" && "Something Went Wrong"}
            </h3>
            {isWorking && (
              <p className="text-xs text-[var(--text-muted)] mt-1">
                You can close this panel and come back.
              </p>
            )}
            {summary && (
              <p className="text-xs text-[var(--text-muted)] mt-2 whitespace-pre-wrap">{summary}</p>
            )}
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* PR link */}
          {prUrl && (
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[rgba(212,115,78,0.1)] transition-colors cursor-pointer"
            >
              View Pull Request
            </a>
          )}

          {/* New request button */}
          {isTerminal && (
            <button
              type="button"
              onClick={onNewRequest}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white hover:opacity-90 transition-opacity cursor-pointer"
            >
              New Request
            </button>
          )}
        </div>

        {/* Difficulty assessment card — shown below status */}
        {difficulty && (
          <DifficultyCard assessment={difficulty} />
        )}
      </div>
    </div>
  )
}
