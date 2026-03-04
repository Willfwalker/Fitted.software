"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface FileUploadZoneProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folder: string
  onUploadComplete: () => void
}

interface UploadItem {
  file: File
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

export function FileUploadZone({
  open,
  onOpenChange,
  folder,
  onUploadComplete,
}: FileUploadZoneProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newItems: UploadItem[] = Array.from(fileList).map((file) => ({
      file,
      status: "pending" as const,
    }))
    setItems((prev) => [...prev, ...newItems])
  }, [])

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  const handleUpload = async () => {
    if (items.length === 0) return
    setIsUploading(true)

    for (let i = 0; i < items.length; i++) {
      if (items[i].status !== "pending") continue

      setItems((prev) =>
        prev.map((item, idx) =>
          idx === i ? { ...item, status: "uploading" } : item
        )
      )

      const formData = new FormData()
      formData.append("file", items[i].file)
      formData.append("folder", folder)

      try {
        const res = await fetch("/api/files/upload", {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error || "Upload failed")
        }

        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, status: "done" } : item
          )
        )
      } catch (err) {
        setItems((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? {
                  ...item,
                  status: "error",
                  error: err instanceof Error ? err.message : "Upload failed",
                }
              : item
          )
        )
      }
    }

    setIsUploading(false)
    onUploadComplete()
  }

  const handleClose = () => {
    if (!isUploading) {
      setItems([])
      onOpenChange(false)
    }
  }

  const pendingCount = items.filter((i) => i.status === "pending").length
  const doneCount = items.filter((i) => i.status === "done").length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)]">
            Upload Files
          </DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10 px-4 cursor-pointer transition-colors ${
            isDragging
              ? "border-[var(--accent)] bg-[rgba(212,115,78,0.06)]"
              : "border-[var(--border)] hover:border-[var(--text-dim)]"
          }`}
        >
          <Upload className="h-8 w-8 text-[var(--text-dim)] mb-3" />
          <p className="text-[0.88rem] text-[var(--text)] font-light mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-[0.75rem] text-[var(--text-dim)]">
            Max 50MB per file
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files)
              e.target.value = ""
            }}
          />
        </div>

        {/* File list */}
        {items.length > 0 && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] px-3 py-2"
              >
                <span className="flex-1 text-[0.82rem] text-[var(--text)] font-light truncate">
                  {item.file.name}
                </span>
                <span className="text-[0.72rem] text-[var(--text-dim)] shrink-0">
                  {(item.file.size / 1024).toFixed(0)} KB
                </span>
                {item.status === "uploading" && (
                  <Loader2 className="h-3.5 w-3.5 text-[var(--accent)] animate-spin shrink-0" />
                )}
                {item.status === "done" && (
                  <span className="text-[0.72rem] text-[#5EC69A] shrink-0">
                    Done
                  </span>
                )}
                {item.status === "error" && (
                  <span
                    className="text-[0.72rem] text-red-400 shrink-0"
                    title={item.error}
                  >
                    Failed
                  </span>
                )}
                {item.status === "pending" && !isUploading && (
                  <button
                    onClick={() => removeItem(i)}
                    className="text-[var(--text-dim)] hover:text-[var(--text)] shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[0.78rem] text-[var(--text-dim)]">
            {items.length > 0 &&
              `${doneCount}/${items.length} uploaded`}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isUploading}
              className="text-[var(--text-muted)] hover:text-[var(--text)]"
            >
              {doneCount === items.length && items.length > 0
                ? "Done"
                : "Cancel"}
            </Button>
            {pendingCount > 0 && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${pendingCount} ${pendingCount === 1 ? "file" : "files"}`
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
