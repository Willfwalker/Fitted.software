"use client"

import { useState, useEffect } from "react"
import { X, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatFileSize, isPreviewable } from "@/lib/types/files"
import { getDownloadUrl } from "@/lib/actions/files"
import type { FileRecord } from "@/lib/types/files"

interface FilePreviewModalProps {
  file: FileRecord | null
  onClose: () => void
}

export function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }

    if (isPreviewable(file.mime_type)) {
      setLoading(true)
      getDownloadUrl(file.id).then((res) => {
        if (res.url) setUrl(res.url)
        setLoading(false)
      })
    }
  }, [file])

  const handleDownload = async () => {
    if (!file) return
    const res = await getDownloadUrl(file.id)
    if (res.url) {
      window.open(res.url, "_blank")
    }
  }

  if (!file) return null

  const canPreview = isPreviewable(file.mime_type)

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[700px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-[family-name:var(--font-display)] text-[1.2rem] text-[var(--text)] truncate pr-4">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preview area */}
        {canPreview && (
          <div className="flex items-center justify-center min-h-[300px] rounded-lg bg-[var(--bg)] border border-[var(--border)] overflow-hidden">
            {loading ? (
              <Loader2 className="h-6 w-6 text-[var(--text-dim)] animate-spin" />
            ) : url ? (
              file.mime_type.startsWith("image/") ? (
                <img
                  src={url}
                  alt={file.name}
                  className="max-w-full max-h-[400px] object-contain"
                />
              ) : file.mime_type === "application/pdf" ? (
                <iframe
                  src={url}
                  className="w-full h-[400px]"
                  title={file.name}
                />
              ) : null
            ) : (
              <p className="text-[0.85rem] text-[var(--text-dim)]">
                Preview unavailable
              </p>
            )}
          </div>
        )}

        {!canPreview && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-[0.88rem] text-[var(--text-muted)] font-light mb-4">
              Preview not available for this file type
            </p>
            <Button
              onClick={handleDownload}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          </div>
        )}

        {/* File info */}
        <div className="flex items-center gap-4 text-[0.78rem] text-[var(--text-dim)] pt-1">
          <span>{formatFileSize(file.size_bytes)}</span>
          <span>{file.mime_type}</span>
          <span>
            {new Date(file.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
