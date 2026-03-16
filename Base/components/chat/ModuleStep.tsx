"use client"

import { ALL_MODULES } from "@/lib/config/modules"

interface ModuleStepProps {
  value: string | null
  onChange: (module: string) => void
}

const EXTRA_OPTIONS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "global", label: "Global / Multiple" },
]

export function ModuleStep({ value, onChange }: ModuleStepProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--text-muted)] mb-3">
        Which module is this for?
      </p>
      <div className="grid gap-2">
        {ALL_MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.label)}
            className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
              value === m.label
                ? "border-[var(--accent)] bg-[rgba(212,115,78,0.1)]"
                : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-dim)]"
            }`}
          >
            <div className="text-sm font-medium text-[var(--text)]">{m.label}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{m.description}</div>
          </button>
        ))}
        {EXTRA_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.label)}
            className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
              value === opt.label
                ? "border-[var(--accent)] bg-[rgba(212,115,78,0.1)]"
                : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-dim)]"
            }`}
          >
            <div className="text-sm font-medium text-[var(--text)]">{opt.label}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
