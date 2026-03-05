"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface LogEntry {
  step: string
  status: "pending" | "running" | "done" | "error"
  message?: string
  timestamp?: string
}

interface StatusData {
  status: string
  vercel_url?: string
  supabase_url?: string
  github_repo?: string
  error_message?: string
  provision_log: LogEntry[]
}

const STEP_LABELS: Record<string, string> = {
  github: "Create GitHub repository",
  supabase: "Create Supabase project & run schemas",
  "supabase-auth": "Configure authentication",
  "supabase-storage": "Set up file storage",
  vercel: "Deploy to Vercel",
  finalize: "Push config & trigger deploy",
}

export function ProvisionStatus({ slug }: { slug: string }) {
  const [data, setData] = useState<StatusData | null>(null)
  const [polling, setPolling] = useState(true)

  useEffect(() => {
    if (!polling) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/provision/${slug}/status`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
          if (json.status === "active" || json.status === "failed" || json.status === "rolled_back") {
            setPolling(false)
          }
        }
      } catch {
        // retry
      }
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [slug, polling])

  if (!data) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
        <div className="animate-pulse text-sm text-[var(--text-muted)]">Loading...</div>
      </div>
    )
  }

  const steps = Object.keys(STEP_LABELS)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] divide-y divide-[var(--border)]">
        {steps.map((step) => {
          const log = data.provision_log.find((l) => l.step === step)
          const status = log?.status ?? "pending"

          return (
            <div key={step} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <StepIcon status={status} />
                <span className="text-sm text-[var(--text)]">{STEP_LABELS[step]}</span>
              </div>
              {log?.message && (
                <span className="text-xs text-[var(--text-dim)]">{log.message}</span>
              )}
            </div>
          )
        })}
      </div>

      {data.status === "active" && (
        <div className="rounded-2xl border border-green-900/30 bg-green-900/10 p-6 space-y-3">
          <p className="text-sm font-medium text-green-400">Provisioning complete!</p>
          <div className="space-y-1 text-xs text-[var(--text-muted)]">
            {data.vercel_url && (
              <p>
                App:{" "}
                <a href={`https://${data.vercel_url}`} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                  {data.vercel_url}
                </a>
              </p>
            )}
            {data.github_repo && <p>Repo: {data.github_repo}</p>}
            {data.supabase_url && <p>Database: {data.supabase_url}</p>}
          </div>
          <Link href="/dashboard" className="inline-block text-sm text-[var(--accent)] hover:underline mt-2">
            Back to clients
          </Link>
        </div>
      )}

      {data.status === "failed" && (
        <div className="rounded-2xl border border-red-900/30 bg-red-900/10 p-6 space-y-2">
          <p className="text-sm font-medium text-red-400">Provisioning failed</p>
          {data.error_message && (
            <p className="text-xs text-red-300/70 font-mono">{data.error_message}</p>
          )}
          <Link href="/dashboard" className="inline-block text-sm text-[var(--accent)] hover:underline mt-2">
            Back to clients
          </Link>
        </div>
      )}
    </div>
  )
}

function StepIcon({ status }: { status: string }) {
  if (status === "done") {
    return <div className="w-5 h-5 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 text-xs">✓</div>
  }
  if (status === "running") {
    return <div className="w-5 h-5 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin" />
  }
  if (status === "error") {
    return <div className="w-5 h-5 rounded-full bg-red-900/30 flex items-center justify-center text-red-400 text-xs">✗</div>
  }
  return <div className="w-5 h-5 rounded-full border border-[var(--border)]" />
}
