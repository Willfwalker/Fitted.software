"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getOrgId } from "./helpers"
import {
  moveFileSchema,
  renameFileSchema,
  attachFileSchema,
} from "@/lib/validations/files"
import { notifyOrgMembers } from "./notifications"
import type { FileRecord, EntityFile, FileEntityType } from "@/lib/types/files"

export type FileActionState = {
  error?: string
  success?: boolean
}

/**
 * Delete a file — removes from storage and database.
 */
export async function deleteFile(id: string): Promise<FileActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  // Get file record to find storage path
  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (fetchError || !file) return { error: "File not found" }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("org-files")
    .remove([file.storage_path])

  if (storageError) return { error: storageError.message }

  // Delete from database (cascades to entity_files)
  const { error } = await supabase
    .from("files")
    .delete()
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/files")
  return { success: true }
}

/**
 * Bulk delete files.
 */
export async function bulkDeleteFiles(ids: string[]): Promise<FileActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }
  if (ids.length === 0) return { error: "No files selected" }

  const supabase = await createClient()

  // Get storage paths
  const { data: files } = await supabase
    .from("files")
    .select("storage_path")
    .in("id", ids)
    .eq("org_id", ctx.orgId)

  if (files && files.length > 0) {
    await supabase.storage
      .from("org-files")
      .remove(files.map((f) => f.storage_path))
  }

  const { error } = await supabase
    .from("files")
    .delete()
    .in("id", ids)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/files")
  return { success: true }
}

/**
 * Move a file to a different folder.
 */
export async function moveFile(
  id: string,
  folder: string
): Promise<FileActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = moveFileSchema.safeParse({ folder })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  const { error } = await supabase
    .from("files")
    .update({ folder: parsed.data.folder })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/files")
  return { success: true }
}

/**
 * Rename a file.
 */
export async function renameFile(
  id: string,
  name: string
): Promise<FileActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = renameFileSchema.safeParse({ name })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  const { error } = await supabase
    .from("files")
    .update({ name: parsed.data.name })
    .eq("id", id)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/files")
  return { success: true }
}

/**
 * Attach a file to an entity (contact, deal, task, etc.).
 */
export async function attachToEntity(params: {
  fileId: string
  entityType: FileEntityType
  entityId: string
}): Promise<FileActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const parsed = attachFileSchema.safeParse({
    file_id: params.fileId,
    entity_type: params.entityType,
    entity_id: params.entityId,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  const { error } = await supabase.from("entity_files").insert({
    file_id: parsed.data.file_id,
    entity_type: parsed.data.entity_type,
    entity_id: parsed.data.entity_id,
    org_id: ctx.orgId,
    created_by: ctx.userId,
  })

  if (error) {
    if (error.code === "23505") return { success: true } // already attached
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * Detach a file from an entity.
 */
export async function detachFromEntity(
  entityFileId: string
): Promise<FileActionState> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { error } = await supabase
    .from("entity_files")
    .delete()
    .eq("id", entityFileId)
    .eq("org_id", ctx.orgId)

  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  return { success: true }
}

/**
 * List files attached to an entity.
 */
export async function listEntityFiles(
  entityType: FileEntityType,
  entityId: string
): Promise<{ data: EntityFile[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("entity_files")
    .select("*, file:files(*)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .eq("org_id", ctx.orgId)
    .order("created_at", { ascending: false })

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as EntityFile[] }
}

/**
 * List all files for the org (file browser).
 */
export async function listFiles(params?: {
  folder?: string
  search?: string
  sort?: string
}): Promise<{ data: FileRecord[]; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { data: [], error: "Not authenticated" }

  const supabase = await createClient()

  let query = supabase
    .from("files")
    .select("*")
    .eq("org_id", ctx.orgId)

  if (params?.folder) {
    query = query.eq("folder", params.folder)
  }

  if (params?.search) {
    query = query.or(
      `name.ilike.%${params.search}%,original_name.ilike.%${params.search}%`
    )
  }

  if (params?.sort === "name") {
    query = query.order("name", { ascending: true })
  } else if (params?.sort === "size") {
    query = query.order("size_bytes", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data, error } = await query

  if (error) return { data: [], error: error.message }

  return { data: (data ?? []) as FileRecord[] }
}

/**
 * Get distinct folders for the org.
 */
export async function getFolders(): Promise<string[]> {
  const ctx = await getOrgId()
  if (!ctx) return ["/"]

  const supabase = await createClient()

  const { data } = await supabase
    .from("files")
    .select("folder")
    .eq("org_id", ctx.orgId)
    .order("folder")

  if (!data) return ["/"]

  const unique = [...new Set(data.map((d) => d.folder))]
  return unique.length > 0 ? unique : ["/"]
}

/**
 * Generate a signed download URL for a file.
 */
export async function getDownloadUrl(
  id: string
): Promise<{ url?: string; error?: string }> {
  const ctx = await getOrgId()
  if (!ctx) return { error: "Not authenticated" }

  const supabase = await createClient()

  const { data: file } = await supabase
    .from("files")
    .select("storage_path, original_name")
    .eq("id", id)
    .eq("org_id", ctx.orgId)
    .single()

  if (!file) return { error: "File not found" }

  const { data, error } = await supabase.storage
    .from("org-files")
    .createSignedUrl(file.storage_path, 3600, {
      download: file.original_name,
    })

  if (error) return { error: error.message }

  return { url: data.signedUrl }
}

/**
 * Notify org members about a file upload. Called from upload handler.
 */
export async function notifyFileUpload(
  fileId: string,
  fileName: string
): Promise<void> {
  const ctx = await getOrgId()
  if (!ctx) return

  await notifyOrgMembers({
    orgId: ctx.orgId,
    performerUserId: ctx.userId,
    category: "file",
    title: `File uploaded: "${fileName}"`,
    link: "/files",
    icon: "Paperclip",
    sourceType: "file",
    sourceId: fileId,
  })
}
