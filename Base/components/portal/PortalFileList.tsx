"use client"

import { FileText, Download } from "lucide-react"
import { getFileIcon, formatFileSize } from "@/lib/types/files"

interface PortalFile {
  id: string
  name: string
  original_name: string
  mime_type: string
  size: number
  storage_path: string
  created_at: string
}

interface PortalFileListProps {
  files: Record<string, unknown>[]
}

export function PortalFileList({ files }: PortalFileListProps) {
  const items = files as unknown as PortalFile[]

  if (items.length === 0) {
    return (
      <p className="text-[0.85rem] text-[var(--text-dim)] italic">No shared files.</p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-4 w-4 text-[var(--text-dim)] shrink-0" />
            <div className="min-w-0">
              <p className="text-[0.85rem] text-[var(--text)] truncate">
                {file.original_name || file.name}
              </p>
              <p className="text-[0.72rem] text-[var(--text-dim)]">
                {formatFileSize(file.size)} · {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Download className="h-4 w-4 text-[var(--text-dim)] shrink-0 cursor-pointer hover:text-[var(--accent)]" />
        </div>
      ))}
    </div>
  )
}
