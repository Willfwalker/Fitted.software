"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Paperclip, Plus, Trash2, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  listEntityFiles,
  attachToEntity,
  detachFromEntity,
  getDownloadUrl,
} from "@/lib/actions/files"
import { formatFileSize, getFileIcon } from "@/lib/types/files"
import type { FileEntityType, EntityFile } from "@/lib/types/files"

interface EntityFileAttacherProps {
  entityType: FileEntityType
  entityId: string
}

export function EntityFileAttacher({
  entityType,
  entityId,
}: EntityFileAttacherProps) {
  const router = useRouter()
  const [files, setFiles] = useState<EntityFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadFiles = useCallback(async () => {
    const res = await listEntityFiles(entityType, entityId)
    setFiles(res.data)
    setLoading(false)
  }, [entityType, entityId])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const handleUploadAndAttach = async (fileList: FileList) => {
    setIsUploading(true)

    for (const file of Array.from(fileList)) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("folder", "/")

      try {
        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) continue

        const body = await res.json()
        if (body.data?.id) {
          await attachToEntity({
            fileId: body.data.id,
            entityType,
            entityId,
          })
        }
      } catch {
        // Skip failed uploads silently
      }
    }

    setIsUploading(false)
    loadFiles()
    router.refresh()
  }

  const handleDetach = async (entityFileId: string) => {
    await detachFromEntity(entityFileId)
    loadFiles()
  }

  const handleDownload = async (fileId: string) => {
    const res = await getDownloadUrl(fileId)
    if (res.url) {
      window.open(res.url, "_blank")
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="h-3.5 w-3.5 text-[var(--text-dim)]" />
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)]">
            Files
          </span>
        </div>
        <label className="cursor-pointer">
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUploadAndAttach(e.target.files)
              }
              e.target.value = ""
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploading}
            className="text-[var(--text-muted)] hover:text-[var(--text)] h-7 text-[0.78rem]"
            asChild
          >
            <span>
              {isUploading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Plus className="h-3 w-3 mr-1" />
              )}
              Attach
            </span>
          </Button>
        </label>
      </div>

      {loading ? (
        <div className="py-4 text-center">
          <Loader2 className="h-4 w-4 text-[var(--text-dim)] animate-spin mx-auto" />
        </div>
      ) : files.length === 0 ? (
        <p className="text-[0.82rem] text-[var(--text-dim)] font-light py-3">
          No files attached
        </p>
      ) : (
        <div className="space-y-1.5">
          {files.map((ef) => (
            <div
              key={ef.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2 group hover:bg-[rgba(232,224,212,0.02)] transition-colors"
            >
              <Paperclip className="h-3.5 w-3.5 text-[var(--text-dim)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[0.82rem] text-[var(--text)] font-light truncate">
                  {ef.file?.name || "File"}
                </p>
                {ef.file && (
                  <p className="text-[0.7rem] text-[var(--text-dim)]">
                    {formatFileSize(ef.file.size_bytes)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => ef.file && handleDownload(ef.file.id)}
                  className="p-1 text-[var(--text-dim)] hover:text-[var(--text)]"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDetach(ef.id)}
                  className="p-1 text-[var(--text-dim)] hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
