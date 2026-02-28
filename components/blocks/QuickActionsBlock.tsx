"use client"

import Link from "next/link"
import * as LucideIcons from "lucide-react"
import type { BlockProps, QuickActionsConfig } from "@/lib/blocks/types"

export function QuickActionsBlock({ config }: BlockProps<QuickActionsConfig>) {
  return (
    <div className="flex flex-wrap gap-3">
      {config.actions.map((action, i) => {
        const IconComp = action.icon
          ? (LucideIcons as Record<string, any>)[action.icon]
          : null

        return (
          <Link
            key={i}
            href={action.href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--border)] text-[0.82rem] text-[var(--text-muted)] font-light hover:border-[var(--accent)] hover:text-[var(--text)] transition-colors"
          >
            {IconComp && (
              <IconComp className="h-3.5 w-3.5" strokeWidth={1.8} />
            )}
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}
