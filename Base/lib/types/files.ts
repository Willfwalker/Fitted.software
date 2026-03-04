// ============================================
// File Storage Type Definitions
// ============================================

export type FileEntityType =
  | "contact"
  | "company"
  | "deal"
  | "invoice"
  | "task"
  | "event"
  | "form_submission"

export interface FileRecord {
  id: string
  org_id: string
  name: string
  original_name: string
  mime_type: string
  size_bytes: number
  storage_path: string
  folder: string
  metadata: Record<string, unknown> | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface EntityFile {
  id: string
  file_id: string
  entity_type: FileEntityType
  entity_id: string
  org_id: string
  created_by: string
  created_at: string
  // Joined
  file?: FileRecord
}

// MIME type to icon mapping for display
export const FILE_TYPE_ICONS: Record<string, string> = {
  "image/": "Image",
  "application/pdf": "FileText",
  "text/": "FileCode",
  "video/": "Film",
  "audio/": "Music",
  "application/zip": "Archive",
  "application/x-zip": "Archive",
  "application/vnd.ms-excel": "Sheet",
  "application/vnd.openxmlformats-officedocument.spreadsheetml": "Sheet",
  "application/msword": "FileText",
  "application/vnd.openxmlformats-officedocument.wordprocessingml": "FileText",
  "application/vnd.ms-powerpoint": "Presentation",
  "application/vnd.openxmlformats-officedocument.presentationml": "Presentation",
}

export function getFileIcon(mimeType: string): string {
  // Check exact matches first
  if (FILE_TYPE_ICONS[mimeType]) return FILE_TYPE_ICONS[mimeType]
  // Check prefix matches
  for (const [prefix, icon] of Object.entries(FILE_TYPE_ICONS)) {
    if (prefix.endsWith("/") && mimeType.startsWith(prefix)) return icon
    if (mimeType.startsWith(prefix)) return icon
  }
  return "File"
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function isPreviewable(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType === "application/pdf"
}
