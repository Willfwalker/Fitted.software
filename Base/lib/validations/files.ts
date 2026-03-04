import { z } from "zod"

export const fileMetadataSchema = z.object({
  name: z.string().min(1, "File name is required").max(255),
  folder: z.string().max(500).default("/"),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const moveFileSchema = z.object({
  folder: z.string().min(1, "Folder is required").max(500),
})

export const renameFileSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
})

export const attachFileSchema = z.object({
  file_id: z.string().uuid("Invalid file ID"),
  entity_type: z.enum([
    "contact",
    "company",
    "deal",
    "invoice",
    "task",
    "event",
    "form_submission",
  ]),
  entity_id: z.string().uuid("Invalid entity ID"),
})

export type FileMetadataFormData = z.infer<typeof fileMetadataSchema>
export type MoveFileFormData = z.infer<typeof moveFileSchema>
export type RenameFileFormData = z.infer<typeof renameFileSchema>
export type AttachFileFormData = z.infer<typeof attachFileSchema>
