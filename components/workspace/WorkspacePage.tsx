"use client"

import { BlockRenderer } from "./BlockRenderer"
import type { WorkspacePage as WorkspacePageType, WorkspaceBlock } from "@/lib/blocks/types"

interface WorkspacePageProps {
  page: WorkspacePageType
  blocks: WorkspaceBlock[]
  orgId: string
}

export function WorkspacePage({ page, blocks, orgId }: WorkspacePageProps) {
  const layout = page.layout || { columns: 4, gap: 16 }

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
        gap: `${layout.gap}px`,
      }}
    >
      {blocks.map((block, i) => (
        <div
          key={block.id}
          className="animate-dash-in"
          style={{
            gridColumn: `span ${Math.min(block.col_span, layout.columns)}`,
            animationDelay: `${i * 60}ms`,
          }}
        >
          <BlockRenderer block={block} orgId={orgId} />
        </div>
      ))}
    </div>
  )
}
