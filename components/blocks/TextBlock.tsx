"use client"

import type { BlockProps, TextConfig } from "@/lib/blocks/types"

export function TextBlock({ config }: BlockProps<TextConfig>) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      {config.title && (
        <div className="px-7 py-5 border-b border-[var(--border)]">
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {config.title}
          </h3>
        </div>
      )}
      <div className="px-7 py-5">
        <div className="text-[0.85rem] text-[var(--text-muted)] font-light leading-relaxed whitespace-pre-wrap">
          {config.content}
        </div>
      </div>
    </div>
  )
}
