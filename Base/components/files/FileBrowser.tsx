"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Search,
  Upload,
  Trash2,
  ArrowUpDown,
  FolderOpen,
  Download,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileCard } from "./FileCard"
import { FileUploadZone } from "./FileUploadZone"
import { FilePreviewModal } from "./FilePreviewModal"
import { DeleteConfirmDialog } from "@/components/crm/DeleteConfirmDialog"
import { deleteFile, bulkDeleteFiles, getDownloadUrl, renameFile } from "@/lib/actions/files"
import type { FileRecord } from "@/lib/types/files"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface FileBrowserProps {
  files: FileRecord[]
  folders: string[]
  currentFolder: string
  searchQuery: string
  currentSort: string
}

export function FileBrowser({
  files,
  folders,
  currentFolder,
  searchQuery,
  currentSort,
}: FileBrowserProps) {
  const router = useRouter()
  const [search, setSearch] = useState(searchQuery)
  const [showUpload, setShowUpload] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<FileRecord | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkDelete, setShowBulkDelete] = useState(false)
  const [renameTarget, setRenameTarget] = useState<FileRecord | null>(null)
  const [renameName, setRenameName] = useState("")

  const buildUrl = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams()
    const folder = params.folder ?? currentFolder
    const q = params.q ?? search
    const sort = params.sort ?? currentSort

    if (folder && folder !== "/") sp.set("folder", folder)
    if (q) sp.set("q", q)
    if (sort && sort !== "recent") sp.set("sort", sort)

    return `/files${sp.toString() ? `?${sp}` : ""}`
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    router.push(buildUrl({ q: value }))
  }

  const handleSort = (value: string) => {
    router.push(buildUrl({ sort: value }))
  }

  const handleFolderChange = (folder: string) => {
    router.push(buildUrl({ folder, q: "" }))
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteFile(deleteTarget.id)
    setDeleteTarget(null)
    router.refresh()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    await bulkDeleteFiles(Array.from(selectedIds))
    setSelectedIds(new Set())
    setShowBulkDelete(false)
    router.refresh()
  }

  const handleDownload = async (file: FileRecord) => {
    const res = await getDownloadUrl(file.id)
    if (res.url) {
      window.open(res.url, "_blank")
    }
  }

  const handleRename = async () => {
    if (!renameTarget || !renameName.trim()) return
    await renameFile(renameTarget.id, renameName.trim())
    setRenameTarget(null)
    setRenameName("")
    router.refresh()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <div className="p-6 sm:p-8 lg:p-12 max-w-[1400px] space-y-6">
        <div className="animate-dash-in">
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[var(--accent)] mb-2 block">
            Documents
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-[2.2rem] text-[var(--text)] leading-tight">
            Files
          </h1>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-dim)]" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-dim)]"
            />
          </div>

          {folders.length > 1 && (
            <Select value={currentFolder} onValueChange={handleFolderChange}>
              <SelectTrigger className="w-[160px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
                <FolderOpen className="h-3.5 w-3.5 mr-1.5 text-[var(--text-dim)]" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
                {folders.map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                    className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
                  >
                    {f === "/" ? "All Files" : f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={currentSort || "recent"} onValueChange={handleSort}>
            <SelectTrigger className="w-[150px] bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] text-[0.82rem]">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-[var(--text-dim)]" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[var(--bg-card)] border-[var(--border)]">
              <SelectItem
                value="recent"
                className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
              >
                Recent
              </SelectItem>
              <SelectItem
                value="name"
                className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
              >
                Name A-Z
              </SelectItem>
              <SelectItem
                value="size"
                className="text-[var(--text)] focus:bg-[rgba(232,224,212,0.05)]"
              >
                Size
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowUpload(true)}
            className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-5"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Upload
          </Button>
        </div>

        {/* File grid */}
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] mb-5">
              <FolderOpen className="h-6 w-6 text-[var(--text-dim)]" />
            </div>
            <h3 className="font-[family-name:var(--font-display)] text-[1.3rem] text-[var(--text)] mb-2">
              No files yet
            </h3>
            <p className="text-[0.88rem] text-[var(--text-muted)] font-light text-center max-w-sm mb-6">
              Upload files to organize documents, images, and attachments.
            </p>
            <Button
              onClick={() => setShowUpload(true)}
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
            >
              Upload Files
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                selected={selectedIds.has(file.id)}
                onSelect={() => toggleSelect(file.id)}
                onPreview={() => setPreviewFile(file)}
                onDownload={() => handleDownload(file)}
                onRename={() => {
                  setRenameTarget(file)
                  setRenameName(file.name)
                }}
                onDelete={() => setDeleteTarget(file)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 rounded-full bg-[var(--bg-card)] border border-[var(--border)] shadow-lg">
          <span className="text-[0.85rem] text-[var(--text)] font-light">
            {selectedIds.size} selected
          </span>
          <Button
            onClick={() => setShowBulkDelete(true)}
            className="bg-red-500/90 hover:bg-red-500 text-white rounded-full px-5 text-[0.82rem]"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Delete
          </Button>
        </div>
      )}

      {/* Upload dialog */}
      <FileUploadZone
        open={showUpload}
        onOpenChange={setShowUpload}
        folder={currentFolder}
        onUploadComplete={() => router.refresh()}
      />

      {/* Preview modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      {/* Delete single */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        onConfirm={handleDelete}
        title="Delete File"
        description={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
      />

      {/* Delete bulk */}
      <DeleteConfirmDialog
        open={showBulkDelete}
        onOpenChange={setShowBulkDelete}
        onConfirm={handleBulkDelete}
        title="Delete Files"
        description={`Are you sure you want to delete ${selectedIds.size} ${selectedIds.size !== 1 ? "files" : "file"}? This action cannot be undone.`}
      />

      {/* Rename dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null)
            setRenameName("")
          }
        }}
      >
        <DialogContent className="bg-[var(--bg-card)] border-[var(--border)] text-[var(--text)] sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-display)] text-[1.2rem] text-[var(--text)]">
              Rename File
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[0.78rem] text-[var(--text-muted)]">
                File Name
              </Label>
              <Input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                className="bg-[var(--bg)] border-[var(--border)] text-[var(--text)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setRenameTarget(null)
                  setRenameName("")
                }}
                className="text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={!renameName.trim()}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-[var(--bg)] rounded-full px-6"
              >
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
