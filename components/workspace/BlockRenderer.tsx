"use client"

import { BLOCK_REGISTRY } from "@/lib/blocks/registry"
import type { WorkspaceBlock } from "@/lib/blocks/types"

interface BlockRendererProps {
  block: WorkspaceBlock
  orgId: string
}

export function BlockRenderer({ block, orgId }: BlockRendererProps) {
  const entry = BLOCK_REGISTRY[block.block_type]

  if (!entry) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-card)] p-7">
        <p className="text-[0.82rem] text-[var(--text-dim)] font-light">
          Unknown block type: <code className="text-[var(--accent)]">{block.block_type}</code>
        </p>
      </div>
    )
  }

  const Component = entry.component

  return (
    <Component
      config={block.config}
      orgId={orgId}
      blockId={block.id}
    />
  )
}
