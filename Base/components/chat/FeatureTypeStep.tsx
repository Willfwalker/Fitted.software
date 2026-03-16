"use client"

import { FEATURE_TYPES, type FeatureType } from "@/lib/types/chat"

interface FeatureTypeStepProps {
  value: FeatureType | null
  onChange: (type: FeatureType) => void
}

export function FeatureTypeStep({ value, onChange }: FeatureTypeStepProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--text-muted)] mb-3">
        What kind of feature do you need?
      </p>
      <div className="grid gap-2">
        {FEATURE_TYPES.map((ft) => (
          <button
            key={ft.value}
            type="button"
            onClick={() => onChange(ft.value)}
            className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
              value === ft.value
                ? "border-[var(--accent)] bg-[rgba(212,115,78,0.1)]"
                : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--text-dim)]"
            }`}
          >
            <div className="text-sm font-medium text-[var(--text)]">{ft.label}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{ft.description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
