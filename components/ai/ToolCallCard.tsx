"use client"

import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  FileText,
  Database,
  Check,
  Loader2,
} from "lucide-react"

const ACTION_ICONS: Record<string, typeof Plus> = {
  get_workspace_state: Search,
  create_page: Plus,
  update_page: Pencil,
  delete_page: Trash2,
  add_block: Plus,
  update_block: Pencil,
  remove_block: Trash2,
  reorder_blocks: ArrowUpDown,
  update_nav: ArrowUpDown,
  query_data: Database,
  create_record: Plus,
  update_record: Pencil,
}

const ACTION_LABELS: Record<string, string> = {
  get_workspace_state: "Reading workspace",
  create_page: "Creating page",
  update_page: "Updating page",
  delete_page: "Deleting page",
  add_block: "Adding block",
  update_block: "Updating block",
  remove_block: "Removing block",
  reorder_blocks: "Reordering blocks",
  update_nav: "Updating navigation",
  query_data: "Querying data",
  create_record: "Creating record",
  update_record: "Updating record",
}

interface ToolCallCardProps {
  toolName: string
  args: Record<string, unknown>
  result?: unknown
  isLoading?: boolean
}

export function ToolCallCard({
  toolName,
  args,
  result,
  isLoading,
}: ToolCallCardProps) {
  const Icon = ACTION_ICONS[toolName] || FileText
  const label = ACTION_LABELS[toolName] || toolName

  const hasError = result && typeof result === "object" && "error" in (result as object)
  const isSuccess = result && !hasError

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 my-1.5">
      <div className="flex items-center gap-2">
        <div
          className={`w-5 h-5 rounded flex items-center justify-center ${
            hasError
              ? "bg-red-500/10"
              : isSuccess
                ? "bg-[rgba(94,198,154,0.1)]"
                : "bg-[rgba(212,115,78,0.1)]"
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-3 h-3 text-[var(--accent)] animate-spin" />
          ) : isSuccess ? (
            <Check className="w-3 h-3 text-[#5EC69A]" />
          ) : (
            <Icon
              className={`w-3 h-3 ${hasError ? "text-red-400" : "text-[var(--accent)]"}`}
            />
          )}
        </div>
        <span className="text-[0.75rem] text-[var(--text-muted)] font-light">
          {label}
        </span>
        {args.title && (
          <span className="text-[0.7rem] text-[var(--text-dim)]">
            — {String(args.title)}
          </span>
        )}
        {args.block_type && (
          <span className="text-[0.7rem] text-[var(--text-dim)]">
            — {String(args.block_type)}
          </span>
        )}
        {args.table && (
          <span className="text-[0.7rem] text-[var(--text-dim)]">
            — {String(args.table)}
          </span>
        )}
      </div>
    </div>
  )
}
