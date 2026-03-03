"use client"

import type { BlockProps, EmbedConfig } from "@/lib/blocks/types"

export function EmbedBlock({ config }: BlockProps<EmbedConfig>) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden h-full">
      {config.title && (
        <div className="px-7 py-5 border-b border-[var(--border)]">
          <h3 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-[var(--text-dim)]">
            {config.title}
          </h3>
        </div>
      )}
      <iframe
        src={config.url}
        height={config.height}
        className="w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        title={config.title || "Embedded content"}
      />
    </div>
  )
}
