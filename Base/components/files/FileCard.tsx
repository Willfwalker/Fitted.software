"use client"

import {
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  FileCode,
  MoreHorizontal,
  Download,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getFileIcon, formatFileSize } from "@/lib/types/files"
import type { FileRecord } from "@/lib/types/files"

const ICON_MAP: Record<string, React.ElementType> = {
  File,
  FileText,
  Image,
  Film,
  Music,
  Archive,
  FileCode,
  Sheet: FileText,
  Presentation: FileText,
}

interface FileCardProps {
  file: FileRecord
  selected: boolean
  onSelect: () => void
  onPreview: () => void
  onDownload: () => void
  onRename: () => void
  onDelete: () => void
}

export function FileCard({
  file,
  selected,
  onSelect,
  onPreview,
  onDownload,
  onRename,
  onDelete,
}: FileCardProps) {
  const iconName = getFileIcon(file.mime_type)
  const Icon = ICON_MAP[iconName] || File
  const isImage = file.mime_type.startsWith("image/")

  return (
    <div
      className={`group relative rounded-xl border p-4 transition-all duration-200 cursor-pointer hover:bg-[rgba(232,224,212,0.02)] ${
        selected
          ? "border-[var(--accent)] bg-[rgba(212,115,78,0.04)]"
          : "border-[var(--border)] bg-[var(--bg-card)]"
      }`}
      onClick={onPreview}
    >
      {/* Checkbox */}
      <div className="absolute top-3 left-3 z-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[var(--border)] accent-[var(--accent)] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity data-[state=checked]:opacity-100"
          style={{ opacity: selected ? 1 : undefined }}
        />
      </div>

      {/* Menu */}
      <div className="absolute top-3 right-3 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-[var(--text-dim)] hover:text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-[var(--bg-card)] border-[var(--border)]"
          >
            {isImage && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview()
                }}
                className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
              >
                <Eye className="h-3.5 w-3.5 mr-2" />
                Preview
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDownload()
              }}
              className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
            >
              <Download className="h-3.5 w-3.5 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onRename()
              }}
              className="text-[var(--text-muted)] focus:text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
            >
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-red-400 focus:text-red-300 focus:bg-[rgba(232,224,212,0.05)]"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg)] border border-[var(--border)] mb-3">
        <Icon className="h-5 w-5 text-[var(--text-dim)]" />
      </div>

      {/* Name */}
      <p className="text-[0.85rem] text-[var(--text)] font-light truncate leading-snug">
        {file.name}
      </p>

      {/* Meta */}
      <p className="text-[0.72rem] text-[var(--text-dim)] mt-1">
        {formatFileSize(file.size_bytes)} &middot;{" "}
        {new Date(file.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </p>
    </div>
  )
}
